import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, DeleteResult, In, Repository } from "typeorm";
import slugify from "slug";

import { ArticleEntity } from "./article.entity";
import { Comment } from "./comment.entity";
import { UserEntity } from "../user/user.entity";
import { FollowsEntity } from "../profile/follows.entity";
import { TagEntity } from "../tag/tag.entity";
import { CreateArticleDto, CreateCommentDto, ArticleQueryDto } from "./dto";
import {
  ArticleResponse,
  ArticleRO,
  ArticlesRO,
  CommentsRO,
} from "./article.interface";

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowsEntity)
    private readonly followsRepository: Repository<FollowsEntity>,
    @InjectRepository(TagEntity)
    private readonly tagRepository: Repository<TagEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: ArticleQueryDto): Promise<ArticlesRO> {
    const qb = this.dataSource
      .getRepository(ArticleEntity)
      .createQueryBuilder("article")
      .leftJoinAndSelect("article.author", "author")
      .leftJoinAndSelect("article.tags", "tags")
      .orderBy("article.createdAt", "DESC");

    if (query.tag) {
      qb.innerJoin("article.tags", "filterTag", "filterTag.name = :tag", {
        tag: query.tag,
      });
    }

    if (query.author) {
      const author = await this.userRepository.findOneBy({
        username: query.author,
      });
      if (!author) return { articles: [], articlesCount: 0 };
      qb.andWhere("article.authorId = :id", { id: author.id });
    }

    if (query.favorited) {
      const user = await this.userRepository.findOne({
        where: { username: query.favorited },
        relations: ["favorites"],
      });
      if (!user) return { articles: [], articlesCount: 0 };
      const ids = user.favorites.map((a) => a.id);
      if (ids.length === 0) return { articles: [], articlesCount: 0 };
      qb.andWhere("article.id IN (:...ids)", { ids });
    }

    const articlesCount = await qb.getCount();
    qb.skip(query.offset).take(query.limit);
    const articles = await qb.getMany();

    return {
      articles: articles.map((article) => this.toArticleResponse(article)),
      articlesCount,
    };
  }

  async findFeed(userId: number, query: ArticleQueryDto): Promise<ArticlesRO> {
    const follows = await this.followsRepository.findBy({ followerId: userId });

    if (!follows.length) {
      return { articles: [], articlesCount: 0 };
    }

    const ids = follows.map((f) => f.followingId);

    const qb = this.dataSource
      .getRepository(ArticleEntity)
      .createQueryBuilder("article")
      .leftJoinAndSelect("article.author", "author")
      .leftJoinAndSelect("article.tags", "tags")
      .where("article.authorId IN (:...ids)", { ids })
      .orderBy("article.createdAt", "DESC");

    const articlesCount = await qb.getCount();
    qb.skip(query.offset).take(query.limit);
    const articles = await qb.getMany();

    return {
      articles: articles.map((article) => this.toArticleResponse(article)),
      articlesCount,
    };
  }

  async findOne(slug: string): Promise<ArticleRO> {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ["author", "tags"],
    });

    if (!article) {
      throw new NotFoundException(`Article with slug "${slug}" not found`);
    }

    return { article: this.toArticleResponse(article) };
  }

  async create(userId: number, dto: CreateArticleDto): Promise<ArticleRO> {
    const author = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["articles"],
    });

    if (!author) throw new NotFoundException("User not found");

    const tags = await this.resolveTags(dto.tagList ?? []);
    const article = this.articleRepository.create({
      slug: this.generateSlug(dto.title),
      title: dto.title,
      description: dto.description,
      body: dto.body,
      tags,
      comments: [],
      author,
    });

    const saved = await this.articleRepository.save(article);
    return { article: this.toArticleResponse(saved) };
  }

  async update(
    slug: string,
    userId: number,
    dto: Partial<CreateArticleDto>,
  ): Promise<ArticleRO> {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ["author", "tags"],
    });

    if (!article) throw new NotFoundException("Article not found");
    if (article.author.id !== userId)
      throw new ForbiddenException("You can only edit your own articles");

    if (dto.title && dto.title !== article.title) {
      article.slug = this.generateSlug(dto.title);
    }

    const { tagList, ...articleUpdates } = dto;
    Object.assign(article, articleUpdates);

    if (tagList) {
      article.tags = await this.resolveTags(tagList);
    }

    const updated = await this.articleRepository.save(article);

    return { article: this.toArticleResponse(updated) };
  }

  async delete(slug: string, userId: number): Promise<DeleteResult> {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ["author"],
    });

    if (!article) throw new NotFoundException("Article not found");
    if (article.author.id !== userId)
      throw new ForbiddenException("You can only delete your own articles");

    return this.articleRepository.delete({ slug });
  }

  async addComment(
    slug: string,
    userId: number,
    dto: CreateCommentDto,
  ): Promise<ArticleRO> {
    const article = await this.articleRepository.findOne({ where: { slug } });
    if (!article) throw new NotFoundException("Article not found");

    const author = await this.userRepository.findOneBy({ id: userId });
    if (!author) throw new NotFoundException("User not found");

    const comment = this.commentRepository.create({
      body: dto.body,
      article,
      author,
    });

    await this.commentRepository.save(comment);
    const updated = await this.articleRepository.findOne({
      where: { slug },
      relations: ["author", "tags"],
    });

    if (!updated) {
      throw new NotFoundException("Article not found after comment creation");
    }

    return { article: this.toArticleResponse(updated) };
  }

  async deleteComment(
    slug: string,
    commentId: number,
    userId: number,
  ): Promise<CommentsRO> {
    const article = await this.articleRepository.findOne({ where: { slug } });
    if (!article) throw new NotFoundException("Article not found");

    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ["author"],
    });

    if (!comment) throw new NotFoundException("Comment not found");
    if (comment.author?.id !== userId)
      throw new ForbiddenException("You can only delete your own comments");

    await this.commentRepository.delete(commentId);

    const updated = await this.articleRepository.findOne({ where: { slug } });
    if (!updated) throw new NotFoundException("Article not found");

    return { comments: updated.comments };
  }

  async findComments(slug: string): Promise<CommentsRO> {
    const article = await this.articleRepository.findOne({ where: { slug } });
    if (!article) throw new NotFoundException("Article not found");
    return { comments: article.comments };
  }

  async favorite(userId: number, slug: string): Promise<ArticleRO> {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ["author", "tags"],
    });
    if (!article) throw new NotFoundException("Article not found");

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["favorites"],
    });
    if (!user) throw new NotFoundException("User not found");

    const alreadyFavorited = user.favorites.some((a) => a.id === article.id);
    if (!alreadyFavorited) {
      user.favorites.push(article);
      article.favoriteCount++;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return { article: this.toArticleResponse(article) };
  }

  async unFavorite(userId: number, slug: string): Promise<ArticleRO> {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ["author", "tags"],
    });
    if (!article) throw new NotFoundException("Article not found");

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["favorites"],
    });
    if (!user) throw new NotFoundException("User not found");

    const idx = user.favorites.findIndex((a) => a.id === article.id);
    if (idx >= 0) {
      user.favorites.splice(idx, 1);
      article.favoriteCount = Math.max(0, article.favoriteCount - 1);
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return { article: this.toArticleResponse(article) };
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

  private toArticleResponse(article: ArticleEntity): ArticleResponse {
    const { tags, ...articleData } = article;

    return {
      ...articleData,
      tagList: (tags ?? []).map((tag) => tag.name),
    } as ArticleResponse;
  }

  private generateSlug(title: string): string {
    const randomSuffix = ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
    return `${slugify(title, { lower: true })}-${randomSuffix}`;
  }
}
