import {
  Body,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Put,
  Controller,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";

import { PostService } from "./post.service";
import { CreatePostDto, PostQueryDto, UpdatePostDto } from "./dto";
import { PostsRO, PostRO } from "./post.interface";
import { User } from "../common/decorators/user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { SlugValidationPipe } from "../common/pipes/slug-validation.pipe";
import { AccessControlGuard } from "@/auth/authorization/access-control.guard";
import { RequirePermissions } from "@/common/decorators/permissions.decorator";
import { Permission } from "@/auth/permissions";
import { AuthenticatedUser } from "@/auth/auth.types";

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

  @Post()
  @UseGuards(JwtAuthGuard, AccessControlGuard)
  @RequirePermissions(Permission.CREATE_ARTICLE)
  create(
    @User("id") userId: number,
    @Body("post") dto: CreatePostDto,
  ): Promise<PostRO> {
    return this.postService.create(userId, dto);
  }

  @Put(":slug")
  @UseGuards(JwtAuthGuard)
  update(
    @User() user: AuthenticatedUser,
    @Param("slug", SlugValidationPipe) slug: string,
    @Body("post") dto: UpdatePostDto,
  ): Promise<PostRO> {
    return this.postService.update(slug, user, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":slug")
  @UseGuards(JwtAuthGuard)
  async delete(
    @User() user: AuthenticatedUser,
    @Param("slug", SlugValidationPipe) slug: string,
  ): Promise<void> {
    await this.postService.delete(slug, user);
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
