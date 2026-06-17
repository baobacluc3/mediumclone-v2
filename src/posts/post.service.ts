import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, In, Repository } from "typeorm";
import slugify from "slug";

import { PostEntity } from "./post.entity";
import { UserEntity } from "../user/user.entity";
import { FollowsEntity } from "../profile/follows.entity";
import { TagEntity } from "../tag/tag.entity";
import { RedisCacheService } from "../cache/redis-cache.service";
import { CreatePostDto, PostQueryDto } from "./dto";
import { PostResponse, PostRO, PostsRO } from "./post.interface";
import { AuthUser, UserRole } from "@/auth/types/auth-user.type";

const POST_LIST_CACHE_TTL_SECONDS = 60;
const POST_DETAIL_CACHE_TTL_SECONDS = 300;

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowsEntity)
    private readonly followsRepository: Repository<FollowsEntity>,
    @InjectRepository(TagEntity)
    private readonly tagRepository: Repository<TagEntity>,
    private readonly cacheService: RedisCacheService,
  ) {}

  async findAll(query: PostQueryDto): Promise<PostsRO> {
    const cacheKey = this.buildPostListCacheKey(query);

    return this.cacheService.remember(
      cacheKey,
      POST_LIST_CACHE_TTL_SECONDS,
      async () => {
        const qb = this.postRepository
          .createQueryBuilder("post")
          .leftJoinAndSelect("post.author", "author")
          .leftJoinAndSelect("post.tags", "tags")
          .orderBy("post.createdAt", "DESC");

        if (query.tag) {
          qb.innerJoin("post.tags", "filterTag", "filterTag.name = :tag", {
            tag: query.tag,
          });
        }

        if (query.author) {
          const author = await this.userRepository.findOneBy({
            username: query.author,
          });
          if (!author) return { posts: [], postsCount: 0 };
          qb.andWhere("post.authorId = :id", { id: author.id });
        }

        if (query.favorited) {
          const user = await this.userRepository.findOne({
            where: { username: query.favorited },
            relations: ["favorites"],
          });
          if (!user) return { posts: [], postsCount: 0 };
          const ids = user.favorites.map((a) => a.id);
          if (ids.length === 0) return { posts: [], postsCount: 0 };
          qb.andWhere("post.id IN (:...ids)", { ids });
        }

        const postsCount = await qb.getCount();
        qb.skip(query.offset).take(query.limit);
        const posts = await qb.getMany();

        return {
          posts: posts.map((post) => this.toPostResponse(post)),
          postsCount,
        };
      },
    );
  }

  async findFeed(userId: number, query: PostQueryDto): Promise<PostsRO> {
    const follows = await this.followsRepository.findBy({ followerId: userId });

    if (!follows.length) {
      return { posts: [], postsCount: 0 };
    }

    const ids = follows.map((f) => f.followingId);

    const qb = this.postRepository
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.author", "author")
      .leftJoinAndSelect("post.tags", "tags")
      .where("post.authorId IN (:...ids)", { ids })
      .orderBy("post.createdAt", "DESC");

    const postsCount = await qb.getCount();
    qb.skip(query.offset).take(query.limit);
    const posts = await qb.getMany();

    return {
      posts: posts.map((post) => this.toPostResponse(post)),
      postsCount,
    };
  }

  async findOne(slug: string): Promise<PostRO> {
    return this.cacheService.remember(
      this.buildPostDetailCacheKey(slug),
      POST_DETAIL_CACHE_TTL_SECONDS,
      async () => {
        const post = await this.findPostOrFail(slug, ["author", "tags"]);

        if (!post) {
          throw new NotFoundException(`Post with slug "${slug}" not found`);
        }

        return { post: this.toPostResponse(post) };
      },
    );
  }

  async create(userId: number, dto: CreatePostDto): Promise<PostRO> {
    const author = await this.userRepository.findOneBy({ id: userId });

    if (!author) throw new NotFoundException("User not found");

    const tags = await this.resolveTags(dto.tagList ?? []);
    const post = this.postRepository.create({
      slug: this.generateSlug(dto.title),
      title: dto.title,
      description: dto.description,
      body: dto.body,
      tags,
      author,
    });

    const saved = await this.postRepository.save(post);
    await this.clearPostCache(saved.slug);

    return { post: this.toPostResponse(saved) };
  }

  async update(
    slug: string,
    user: AuthUser,
    dto: Partial<CreatePostDto>,
  ): Promise<PostRO> {
    const post = await this.findPostOrFail(slug, ["author", "tags"]);
    const oldSlug = post.slug;

    if (!post) throw new NotFoundException("Post not found");
    if (post.author.id !== user.id && !user.roles?.includes(UserRole.ADMIN))
      throw new ForbiddenException("You can only edit your own posts");

    if (dto.title && dto.title !== post.title) {
      post.slug = this.generateSlug(dto.title);
    }

    const { tagList, ...postUpdates } = dto;
    Object.assign(post, postUpdates);

    if (tagList) {
      post.tags = await this.resolveTags(tagList);
    }

    const updated = await this.postRepository.save(post);
    await this.clearPostCache(oldSlug);
    await this.clearPostCache(updated.slug);

    return { post: this.toPostResponse(updated) };
  }

  async delete(slug: string, user: AuthUser): Promise<DeleteResult> {
    const post = await this.findPostOrFail(slug, ["author"]);

    if (!post) throw new NotFoundException("Post not found");
    if (post.author.id !== user.id && !user.roles?.includes(UserRole.ADMIN))
      throw new ForbiddenException("You can only delete your own posts");

    const result = await this.postRepository.delete({ slug });
    await this.clearPostCache(slug);

    return result;
  }

  async favorite(userId: number, slug: string): Promise<PostRO> {
    return this.setFavorite(userId, slug, true);
  }

  private async setFavorite(
    userId: number,
    slug: string,
    shouldFavorite: boolean,
  ): Promise<PostRO> {
    const post = await this.findPostOrFail(slug, ["author", "tags"]);

    if (!post) throw new NotFoundException("Post not found");

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["favorites"],
    });

    if (!user) throw new NotFoundException("User not found");

    const index = user.favorites.findIndex((a) => a.id === post.id);
    const alreadyFavorited = index >= 0;

    if (shouldFavorite && !alreadyFavorited) {
      user.favorites.push(post);
      post.favoriteCount++;
    }

    if (!shouldFavorite && alreadyFavorited) {
      user.favorites.splice(index, 1);
      post.favoriteCount = Math.max(0, post.favoriteCount - 1);
    }

    await this.userRepository.save(user);
    await this.postRepository.save(post);
    await this.clearPostCache(slug);

    return { post: this.toPostResponse(post) };
  }

  async unFavorite(userId: number, slug: string): Promise<PostRO> {
    return this.setFavorite(userId, slug, false);
  }

  private async resolveTags(tagList: string[]): Promise<TagEntity[]> {
    const tagNames = this.normalizeTagList(tagList);

    if (!tagNames.length) {
      return [];
    }

    const existingTags = await this.tagRepository.findBy({
      name: In(tagNames),
    });
    const existingNames = new Set(existingTags.map((tag) => tag.name));
    const newTags = tagNames
      .filter((name) => !existingNames.has(name))
      .map((name) => this.tagRepository.create({ name }));

    const savedNewTags = newTags.length
      ? await this.tagRepository.save(newTags)
      : [];

    const tagsByName = new Map(
      [...existingTags, ...savedNewTags].map((tag) => [tag.name, tag]),
    );

    return tagNames.map((name) => tagsByName.get(name)).filter(Boolean);
  }

  private normalizeTagList(tagList: string[]): string[] {
    const normalized = tagList.map((tag) => tag.trim()).filter(Boolean);

    const invalidTag = normalized.find((tag) => tag.length > 50);
    if (invalidTag) {
      throw new BadRequestException(
        `Tag "${invalidTag}" exceeds the 50 character limit.`,
      );
    }

    return [...new Set(normalized)];
  }

  private toPostResponse(post: PostEntity): PostResponse {
    const { tags, ...postData } = post;

    return {
      ...postData,
      tagList: (tags ?? []).map((tag) => tag.name),
    } as PostResponse;
  }

  private generateSlug(title: string): string {
    const randomSuffix = ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
    return `${slugify(title, { lower: true })}-${randomSuffix}`;
  }

  private buildPostListCacheKey(query: PostQueryDto): string {
    const cacheQuery = {
      tag: query.tag ?? "",
      author: query.author ?? "",
      favorited: query.favorited ?? "",
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    };

    return `posts:list:${JSON.stringify(cacheQuery)}`;
  }

  private buildPostDetailCacheKey(slug: string): string {
    return `posts:detail:${slug}`;
  }

  private async clearPostCache(slug?: string): Promise<void> {
    await this.cacheService.deleteByPattern("posts:list:*");

    if (slug) {
      await this.cacheService.del(this.buildPostDetailCacheKey(slug));
    }
  }

  private async findPostOrFail(
    slug: string,
    relations: string[] = [],
  ): Promise<PostEntity> {
    const post = await this.postRepository.findOne({
      where: { slug },
      relations,
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    return post;
  }
}
