import {
  Get,
  Post,
  Delete,
  Query,
  Param,
  Controller,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";

import { PostService } from "./post.service";
import { CreatePostDto, PostQueryDto } from "./dto";
import { PostsRO, PostRO } from "./post.interface";
import { User } from "../common/decorators/user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { SlugValidationPipe } from "../common/pipes/slug-validation.pipe";

@Controller("posts")
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  findAll(@Query() query: PostQueryDto): Promise<PostsRO> {
    return this.postService.findAll(query);
  }

  @Get("feed")
  @UseGuards(JwtAuthGuard)
  getFeed(
    @User("id") userId: number,
    @Query() query: PostQueryDto,
  ): Promise<PostsRO> {
    return this.postService.findFeed(userId, query);
  }

  @Get(":slug")
  findOne(@Param("slug", SlugValidationPipe) slug: string): Promise<PostRO> {
    return this.postService.findOne(slug);
  }

  @Post(":slug/favorite")
  @UseGuards(JwtAuthGuard)
  favorite(
    @User("id") userId: number,
    @Param("slug", SlugValidationPipe) slug: string,
  ): Promise<PostRO> {
    return this.postService.favorite(userId, slug);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(":slug/favorite")
  @UseGuards(JwtAuthGuard)
  unFavorite(
    @User("id") userId: number,
    @Param("slug", SlugValidationPipe) slug: string,
  ): Promise<PostRO> {
    return this.postService.unFavorite(userId, slug);
  }
}
