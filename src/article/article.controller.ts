import {
  Get,
  Post,
  Body,
  Put,
  Delete,
  Query,
  Param,
  Controller,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";

import { ArticleService } from "./article.service";
import { CreateArticleDto, CreateCommentDto, ArticleQueryDto } from "./dto";
import { ArticlesRO, ArticleRO, CommentsRO } from "./article.interface";
import { User } from "../common/decorators/user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

@Controller("articles")
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  findAll(@Query() query: ArticleQueryDto): Promise<ArticlesRO> {
    return this.articleService.findAll(query);
  }

  @Get("feed")
  @UseGuards(JwtAuthGuard)
  getFeed(
    @User("id") userId: number,
    @Query() query: ArticleQueryDto,
  ): Promise<ArticlesRO> {
    return this.articleService.findFeed(userId, query);
  }

  @Get(":slug")
  findOne(@Param("slug") slug: string): Promise<ArticleRO> {
    return this.articleService.findOne(slug);
  }

  @Get(":slug/comments")
  findComments(@Param("slug") slug: string): Promise<CommentsRO> {
    return this.articleService.findComments(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @User("id") userId: number,
    @Body("article") dto: CreateArticleDto,
  ): Promise<ArticleRO> {
    return this.articleService.create(userId, dto);
  }

  @Put(":slug")
  @UseGuards(JwtAuthGuard)
  update(
    @User("id") userId: number,
    @Param("slug") slug: string,
    @Body("article") dto: Partial<CreateArticleDto>,
  ): Promise<ArticleRO> {
    return this.articleService.update(slug, userId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":slug")
  @UseGuards(JwtAuthGuard)
  delete(@User("id") userId: number, @Param("slug") slug: string) {
    return this.articleService.delete(slug, userId);
  }

  @Post(":slug/comments")
  @UseGuards(JwtAuthGuard)
  createComment(
    @User("id") userId: number,
    @Param("slug") slug: string,
    @Body("comment") dto: CreateCommentDto,
  ): Promise<ArticleRO> {
    return this.articleService.addComment(slug, userId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":slug/comments/:id")
  @UseGuards(JwtAuthGuard)
  deleteComment(
    @User("id") userId: number,
    @Param("slug") slug: string,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<CommentsRO> {
    return this.articleService.deleteComment(slug, id, userId);
  }

  @Post(":slug/favorite")
  @UseGuards(JwtAuthGuard)
  favorite(
    @User("id") userId: number,
    @Param("slug") slug: string,
  ): Promise<ArticleRO> {
    return this.articleService.favorite(userId, slug);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(":slug/favorite")
  @UseGuards(JwtAuthGuard)
  unFavorite(
    @User("id") userId: number,
    @Param("slug") slug: string,
  ): Promise<ArticleRO> {
    return this.articleService.unFavorite(userId, slug);
  }
}
