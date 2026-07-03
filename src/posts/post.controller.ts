import {
  Body,
  Get,
  Post,
  Delete,
  Param,
  Put,
  Query,
  Controller,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";

import { PostService } from "./post.service";
import { CreatePostDto, UpdatePostDto, FindPostsQueryDto } from "./dto";
import { PostsRO, PostRO } from "./post.interface";
import { User } from "../common/decorators/user.decorator";
import { RequiredBodyPipe } from "@/common/pipes/required-body.pipe";
import { SlugValidationPipe } from "../common/pipes/slug-validation.pipe";
import { Public } from "@/authorization/decorators/public.decorator";
import { RequirePermissions } from "@/authorization/decorators/require-permissions.decorator";
import { Action } from "@/authorization/domain/action.enum";
import { AppSubject } from "@/authorization/domain/app-subject.enum";
import { AuthenticatedUser } from "@/auth/auth.types";
import { RateLimit } from "@/common/decorators/rate-limit.decorator";
import { RateLimitGuard } from "@/common/guards/rate-limit.guard";

@Controller("posts")
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  @Public()
  findAll(@Query() query: FindPostsQueryDto): Promise<PostsRO> {
    return this.postService.findAll(query);
  }

  @Get(":slug")
  @Public()
  findOne(@Param("slug", SlugValidationPipe) slug: string): Promise<PostRO> {
    return this.postService.findOne(slug);
  }

  @Post()
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 10, ttlMs: 60_000 })
  @RequirePermissions({ action: Action.Create, subject: AppSubject.Article })
  create(
    @User("id") userId: number,
    @Body("post", new RequiredBodyPipe("post")) dto: CreatePostDto,
  ): Promise<PostRO> {
    return this.postService.create(userId, dto);
  }

  @Put(":slug")
  update(
    @User() user: AuthenticatedUser,
    @Param("slug", SlugValidationPipe) slug: string,
    @Body("post", new RequiredBodyPipe("post")) dto: UpdatePostDto,
  ): Promise<PostRO> {
    return this.postService.update(slug, user, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":slug")
  async delete(
    @User() user: AuthenticatedUser,
    @Param("slug", SlugValidationPipe) slug: string,
  ): Promise<void> {
    await this.postService.delete(slug, user);
  }

  @Post(":slug/favorite")
  favorite(
    @User("id") userId: number,
    @Param("slug", SlugValidationPipe) slug: string,
  ): Promise<PostRO> {
    return this.postService.favorite(userId, slug);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(":slug/favorite")
  unFavorite(
    @User("id") userId: number,
    @Param("slug", SlugValidationPipe) slug: string,
  ): Promise<PostRO> {
    return this.postService.unFavorite(userId, slug);
  }
}
