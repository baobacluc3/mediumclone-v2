import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, In, Repository } from "typeorm";
import slugify from "slug";
import { randomBytes } from "crypto";

import { PostEntity } from "./post.entity";
import { UserEntity } from "../user/user.entity";
import { TagEntity } from "../tag/tag.entity";
import { RedisCacheService } from "../cache/redis-cache.service";
import { CreatePostDto } from "./dto";
import { PostResponse, PostRO, PostsRO } from "./post.interface";
import { AccessControlService } from "@/auth/authorization/access-control.service";
import { Permission } from "@/auth/permissions";
import { AuthUser } from "@/auth/types/auth-user.type";

const POST_LIST_CACHE_TTL_SECONDS = 60;
const POST_DETAIL_CACHE_TTL_SECONDS = 300;

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(TagEntity)
    private readonly tagRepository: Repository<TagEntity>,
    private readonly cacheService: RedisCacheService,
    private readonly accessControl: AccessControlService,
  ) {}

  async findAll(): Promise<PostsRO> {
    return this.cacheService.remember(
      this.buildPostListCacheKey(),
      POST_LIST_CACHE_TTL_SECONDS,
      async () => {
        const qb = this.postRepository
          .createQueryBuilder("post")
          .leftJoinAndSelect("post.author", "author")
          .leftJoinAndSelect("post.tags", "tags")
          .orderBy("post.createdAt", "DESC");

        const postsCount = await qb.getCount();
        const posts = await qb.getMany();

        return {
          posts: posts.map((post) => this.toPostResponse(post)),
          postsCount,
        };
      },
    );
  }

  async findOne(slug: string): Promise<PostRO> {
    return this.cacheService.remember(
      this.buildPostDetailCacheKey(slug),
      POST_DETAIL_CACHE_TTL_SECONDS,
      async () => {
        const post = await this.findPostOrFail(slug, ["author", "tags"]);

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

    if (
      post.author.id !== user.id &&
      !this.accessControl.hasEveryPermission(user.roles, [
        Permission.UPDATE_ANY_ARTICLE,
      ])
    ) {
      throw new ForbiddenException("You can only edit your own posts");
    }

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

    if (
      post.author.id !== user.id &&
      !this.accessControl.hasEveryPermission(user.roles, [
        Permission.DELETE_ANY_ARTICLE,
      ])
    ) {
      throw new ForbiddenException("You can only delete your own posts");
    }

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
    const suffix = randomBytes(3).toString("hex");
    return `${slugify(title, { lower: true })}-${suffix}`;
  }

  private buildPostListCacheKey(): string {
    return "posts:list:all";
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
