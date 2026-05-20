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
import { CreateArticleDto, ArticleQueryDto } from "./dto";
import { ArticlesRO, ArticleRO } from "./article.interface";
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
