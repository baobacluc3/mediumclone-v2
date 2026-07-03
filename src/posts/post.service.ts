import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import {
  DataSource,
  DeleteResult,
  EntityManager,
  In,
  Repository,
} from "typeorm";
import slugify from "slug";
import { randomBytes } from "crypto";

import { PostEntity } from "./post.entity";
import { UserEntity } from "../user/user.entity";
import { TagEntity } from "../tag/tag.entity";
import { CreatePostDto, FindPostsQueryDto } from "./dto";
import { PostResponse, PostRO, PostsRO } from "./post.interface";
import { CaslAbilityFactory } from "@/authorization/abilities/casl-ability.factory";
import { Action } from "@/authorization/domain/action.enum";
import { AuthUser } from "@/auth/types/auth-user.type";

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly abilityFactory: CaslAbilityFactory,
  ) {}

  async findAll(query: FindPostsQueryDto): Promise<PostsRO> {
    const qb = this.postRepository
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.author", "author")
      .leftJoinAndSelect("post.tags", "tags");

    // Filters use inner joins on relations (no raw join-table names) so an
    // unknown tag/author/favoriter yields an empty page rather than an error.
    if (query.tag) {
      qb.innerJoin("post.tags", "filterTag", "filterTag.name = :tag", {
        tag: query.tag,
      });
    }

    if (query.author) {
      qb.andWhere("author.username = :author", { author: query.author });
    }

    if (query.favorited) {
      // Correlated EXISTS over the owning `favorites` relation: keeps the
      // join table out of the page's own FROM (so pagination stays on
      // distinct posts) and avoids naming the auto-generated join table.
      qb.andWhere((subQb) => {
        const sub = subQb
          .subQuery()
          .select("favUser.id")
          .from(UserEntity, "favUser")
          .innerJoin("favUser.favorites", "favPost", "favPost.id = post.id")
          .where("favUser.username = :favorited")
          .getQuery();
        return `EXISTS ${sub}`;
      }).setParameter("favorited", query.favorited);
    }

    if (query.search) {
      // Escape LIKE wildcards so a search for "50%" matches the literal text
      // instead of turning into a match-everything pattern.
      const escaped = query.search.replace(/[\\%_]/g, (char) => `\\${char}`);
      qb.andWhere(
        "(post.title ILIKE :search OR post.description ILIKE :search)",
        { search: `%${escaped}%` },
      );
    }

    // The sort column comes from the PostSortField enum (validated in the
    // DTO), never raw user input — this is what makes dynamic ORDER BY safe.
    // `post.id` breaks ties so identical sort values can't reshuffle between
    // pages and show a row twice (or never).
    qb.orderBy(`post.${query.sortBy}`, query.sortDir)
      .addOrderBy("post.id", "DESC")
      // take/skip (not limit/offset) so TypeORM paginates distinct posts even
      // with the joined tags collection, instead of counting joined rows.
      .skip(query.offset)
      .take(query.limit);

    const [posts, postsCount] = await qb.getManyAndCount();

    return {
      posts: posts.map((post) => this.toPostResponse(post)),
      postsCount,
    };
  }

  async findOne(slug: string): Promise<PostRO> {
    const post = await this.findPostOrFail(slug, ["author", "tags"]);

    return { post: this.toPostResponse(post) };
  }

  async create(userId: number, dto: CreatePostDto): Promise<PostRO> {
    // Tag resolution + post insert run in one transaction: either the post and
    // all of its (possibly newly-created) tags commit together, or nothing does.
    const saved = await this.dataSource.transaction(async (manager) => {
      const author = await manager.findOneBy(UserEntity, { id: userId });

      if (!author) throw new NotFoundException("User not found");

      const tags = await this.resolveTags(dto.tagList ?? [], manager);
      const post = manager.create(PostEntity, {
        slug: this.generateSlug(dto.title),
        title: dto.title,
        description: dto.description,
        body: dto.body,
        tags,
        author,
      });

      return manager.save(post);
    });

    return { post: this.toPostResponse(saved) };
  }

  async update(
    slug: string,
    user: AuthUser,
    dto: Partial<CreatePostDto>,
  ): Promise<PostRO> {
    const updated = await this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(PostEntity, {
        where: { slug },
        relations: ["author", "tags"],
      });

      if (!post) throw new NotFoundException("Post not found");

      const ability = await this.abilityFactory.createForUser(user);
      if (ability.cannot(Action.Update, post)) {
        throw new ForbiddenException("You can only edit your own posts");
      }

      if (dto.title && dto.title !== post.title) {
        post.slug = this.generateSlug(dto.title);
      }

      const { tagList, ...postUpdates } = dto;
      Object.assign(post, postUpdates);

      if (tagList) {
        post.tags = await this.resolveTags(tagList, manager);
      }

      return manager.save(post);
    });

    return { post: this.toPostResponse(updated) };
  }

  async delete(slug: string, user: AuthUser): Promise<DeleteResult> {
    const post = await this.findPostOrFail(slug, ["author"]);

    const ability = await this.abilityFactory.createForUser(user);
    if (ability.cannot(Action.Delete, post)) {
      throw new ForbiddenException("You can only delete your own posts");
    }

    return this.postRepository.delete({ slug });
  }

  async favorite(userId: number, slug: string): Promise<PostRO> {
    return this.setFavorite(userId, slug, true);
  }

  private async setFavorite(
    userId: number,
    slug: string,
    shouldFavorite: boolean,
  ): Promise<PostRO> {
    const post = await this.dataSource.transaction(async (manager) => {
      // Lock just the post row (no joins, so FOR UPDATE is valid). Concurrent
      // favorite/unfavorite calls on the same post now serialize here instead
      // of racing on favoriteCount and double-counting.
      const locked = await manager.findOne(PostEntity, {
        where: { slug },
        lock: { mode: "pessimistic_write" },
      });

      if (!locked) throw new NotFoundException("Post not found");

      const userExists = await manager.exists(UserEntity, {
        where: { id: userId },
      });

      if (!userExists) throw new NotFoundException("User not found");

      const alreadyFavorited = await this.isFavorited(
        manager,
        userId,
        locked.id,
      );
      const favorites = manager
        .createQueryBuilder()
        .relation(UserEntity, "favorites")
        .of(userId);

      if (shouldFavorite && !alreadyFavorited) {
        await favorites.add(locked.id);
        // Atomic `SET "favoriteCount" = "favoriteCount" + 1` — never a read /
        // mutate / write round-trip that two requests could interleave.
        await manager.increment(
          PostEntity,
          { id: locked.id },
          "favoriteCount",
          1,
        );
      } else if (!shouldFavorite && alreadyFavorited) {
        await favorites.remove(locked.id);
        await manager.decrement(
          PostEntity,
          { id: locked.id },
          "favoriteCount",
          1,
        );
      }

      // Re-read with relations so the response carries the post-update count.
      return manager.findOne(PostEntity, {
        where: { id: locked.id },
        relations: ["author", "tags"],
      });
    });

    return { post: this.toPostResponse(post) };
  }

  /** Whether `userId` currently favorites `postId`, checked via the join table
   * without loading the user's entire favorites collection. */
  private async isFavorited(
    manager: EntityManager,
    userId: number,
    postId: number,
  ): Promise<boolean> {
    const count = await manager
      .createQueryBuilder(UserEntity, "user")
      .innerJoin("user.favorites", "favorite", "favorite.id = :postId", {
        postId,
      })
      .where("user.id = :userId", { userId })
      .getCount();

    return count > 0;
  }

  async unFavorite(userId: number, slug: string): Promise<PostRO> {
    return this.setFavorite(userId, slug, false);
  }

  private async resolveTags(
    tagList: string[],
    manager: EntityManager,
  ): Promise<TagEntity[]> {
    const tagNames = this.normalizeTagList(tagList);

    if (!tagNames.length) {
      return [];
    }

    const existingTags = await manager.findBy(TagEntity, {
      name: In(tagNames),
    });
    const existingNames = new Set(existingTags.map((tag) => tag.name));
    const missingNames = tagNames.filter((name) => !existingNames.has(name));

    if (missingNames.length) {
      // ON CONFLICT DO NOTHING closes the race where a concurrent request
      // inserts the same tag name between our read above and this write.
      await manager
        .createQueryBuilder()
        .insert()
        .into(TagEntity)
        .values(missingNames.map((name) => ({ name })))
        .orIgnore()
        .execute();
    }

    // Re-read the full set so we return persisted rows with their ids, including
    // any a competing transaction created.
    const tags = await manager.findBy(TagEntity, { name: In(tagNames) });
    const tagsByName = new Map(tags.map((tag) => [tag.name, tag]));

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
