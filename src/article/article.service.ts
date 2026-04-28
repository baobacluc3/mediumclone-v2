import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, DeleteResult, Repository } from "typeorm";
import slugify from "slug";

import { ArticleEntity } from "./article.entity";
import { Comment } from "./comment.entity";
import { UserEntity } from "../user/user.entity";
import { FollowsEntity } from "../profile/follows.entity";
import { CreateArticleDto, CreateCommentDto, ArticleQueryDto } from "./dto";
import { ArticleRO, ArticlesRO, CommentsRO } from "./article.interface";

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
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: ArticleQueryDto): Promise<ArticlesRO> {
    const qb = this.dataSource
      .getRepository(ArticleEntity)
      .createQueryBuilder("article")
      .leftJoinAndSelect("article.author", "author")
      .orderBy("article.createdAt", "DESC");

    if (query.tag) {
      qb.andWhere("article.tagList LIKE :tag", { tag: `%${query.tag}%` });
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

    return { articles, articlesCount };
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
      .where("article.authorId IN (:...ids)", { ids })
      .orderBy("article.createdAt", "DESC");

    const articlesCount = await qb.getCount();
    qb.skip(query.offset).take(query.limit);
    const articles = await qb.getMany();

    return { articles, articlesCount };
  }

  async findOne(slug: string): Promise<ArticleRO> {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ["author"],
    });

    if (!article) {
      throw new NotFoundException(`Article with slug "${slug}" not found`);
    }

    return { article };
  }

  async create(userId: number, dto: CreateArticleDto): Promise<ArticleRO> {
    const author = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["articles"],
    });

    if (!author) throw new NotFoundException("User not found");

    const article = this.articleRepository.create({
      ...dto,
      slug: this.generateSlug(dto.title),
      tagList: dto.tagList ?? [],
      comments: [],
      author,
    });

    const saved = await this.articleRepository.save(article);
    return { article: saved };
  }

  async update(
    slug: string,
    userId: number,
    dto: Partial<CreateArticleDto>,
  ): Promise<ArticleRO> {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ["author"],
    });

    if (!article) throw new NotFoundException("Article not found");
    if (article.author.id !== userId)
      throw new ForbiddenException("You can only edit your own articles");

    if (dto.title && dto.title !== article.title) {
      article.slug = this.generateSlug(dto.title);
    }

    Object.assign(article, dto);
    const updated = await this.articleRepository.save(article);

    return { article: updated };
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

    const comment = this.commentRepository.create({
      body: dto.body,
      article,
      author,
    });

    await this.commentRepository.save(comment);
    const updated = await this.articleRepository.findOne({ where: { slug } });

    return { article: updated };
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
    return { comments: updated.comments };
  }

  async findComments(slug: string): Promise<CommentsRO> {
    const article = await this.articleRepository.findOne({ where: { slug } });
    if (!article) throw new NotFoundException("Article not found");
    return { comments: article.comments };
  }

  async favorite(userId: number, slug: string): Promise<ArticleRO> {
    const article = await this.articleRepository.findOneBy({ slug });
    if (!article) throw new NotFoundException("Article not found");

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["favorites"],
    });

    const alreadyFavorited = user.favorites.some((a) => a.id === article.id);
    if (!alreadyFavorited) {
      user.favorites.push(article);
      article.favoriteCount++;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return { article };
  }

  async unFavorite(userId: number, slug: string): Promise<ArticleRO> {
    const article = await this.articleRepository.findOneBy({ slug });
    if (!article) throw new NotFoundException("Article not found");

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["favorites"],
    });

    const idx = user.favorites.findIndex((a) => a.id === article.id);
    if (idx >= 0) {
      user.favorites.splice(idx, 1);
      article.favoriteCount = Math.max(0, article.favoriteCount - 1);
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return { article };
  }

  private generateSlug(title: string): string {
    const randomSuffix = ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
    return `${slugify(title, { lower: true })}-${randomSuffix}`;
  }
}
