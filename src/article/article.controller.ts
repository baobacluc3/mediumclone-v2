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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { ArticleService } from "./article.service";
import { CreateArticleDto, CreateCommentDto, ArticleQueryDto } from "./dto";
import { ArticlesRO, ArticleRO, CommentsRO } from "./article.interface";
import { User } from "../user/user.decorator";
import { JwtAuthGuard } from "../user/jwt-auth.guard";

@ApiBearerAuth()
@ApiTags("articles")
@Controller("articles")
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @ApiOperation({ summary: "Get all articles with optional filters" })
  @ApiResponse({
    status: 200,
    description: "Returns paginated list of articles.",
  })
  @Get()
  findAll(@Query() query: ArticleQueryDto): Promise<ArticlesRO> {
    return this.articleService.findAll(query);
  }

  @ApiOperation({ summary: "Get articles from followed users" })
  @ApiResponse({ status: 200, description: "Returns feed articles." })
  @Get("feed")
  @UseGuards(JwtAuthGuard)
  getFeed(
    @User("id") userId: number,
    @Query() query: ArticleQueryDto,
  ): Promise<ArticlesRO> {
    return this.articleService.findFeed(userId, query);
  }

  @ApiOperation({ summary: "Get a single article by slug" })
  @ApiResponse({ status: 200, description: "Returns the article." })
  @ApiResponse({ status: 404, description: "Article not found." })
  @Get(":slug")
  findOne(@Param("slug") slug: string): Promise<ArticleRO> {
    return this.articleService.findOne(slug);
  }

  @ApiOperation({ summary: "Get comments for an article" })
  @ApiResponse({ status: 200, description: "Returns comments." })
  @Get(":slug/comments")
  findComments(@Param("slug") slug: string): Promise<CommentsRO> {
    return this.articleService.findComments(slug);
  }

  @ApiOperation({ summary: "Create a new article" })
  @ApiResponse({ status: 201, description: "Article created successfully." })
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @User("id") userId: number,
    @Body("article") dto: CreateArticleDto,
  ): Promise<ArticleRO> {
    return this.articleService.create(userId, dto);
  }

  @ApiOperation({ summary: "Update an article" })
  @ApiResponse({ status: 200, description: "Article updated successfully." })
  @ApiResponse({
    status: 403,
    description: "Forbidden – not the article author.",
  })
  @Put(":slug")
  @UseGuards(JwtAuthGuard)
  update(
    @User("id") userId: number,
    @Param("slug") slug: string,
    @Body("article") dto: Partial<CreateArticleDto>,
  ): Promise<ArticleRO> {
    return this.articleService.update(slug, userId, dto);
  }

  @ApiOperation({ summary: "Delete an article" })
  @ApiResponse({ status: 204, description: "Article deleted." })
  @ApiResponse({
    status: 403,
    description: "Forbidden – not the article author.",
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":slug")
  @UseGuards(JwtAuthGuard)
  delete(@User("id") userId: number, @Param("slug") slug: string) {
    return this.articleService.delete(slug, userId);
  }

  @ApiOperation({ summary: "Add a comment to an article" })
  @ApiResponse({ status: 201, description: "Comment created." })
  @Post(":slug/comments")
  @UseGuards(JwtAuthGuard)
  createComment(
    @User("id") userId: number,
    @Param("slug") slug: string,
    @Body("comment") dto: CreateCommentDto,
  ): Promise<ArticleRO> {
    return this.articleService.addComment(slug, userId, dto);
  }

  @ApiOperation({ summary: "Delete a comment" })
  @ApiResponse({ status: 204, description: "Comment deleted." })
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

  @ApiOperation({ summary: "Favorite an article" })
  @Post(":slug/favorite")
  @UseGuards(JwtAuthGuard)
  favorite(
    @User("id") userId: number,
    @Param("slug") slug: string,
  ): Promise<ArticleRO> {
    return this.articleService.favorite(userId, slug);
  }

  @ApiOperation({ summary: "Unfavorite an article" })
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
