import {
  Body,
  Get,
  Post,
  Delete,
  Param,
  Put,
  Controller,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";

import { PostService } from "./post.service";
import { CreatePostDto, UpdatePostDto } from "./dto";
import { PostsRO, PostRO } from "./post.interface";
import { User } from "../common/decorators/user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { RequiredBodyPipe } from "@/common/pipes/required-body.pipe";
import { SlugValidationPipe } from "../common/pipes/slug-validation.pipe";
import { RequirePermissions } from "@/common/decorators/permissions.decorator";
import { Permission } from "@/auth/permissions";
import { AuthenticatedUser } from "@/auth/auth.types";

@Controller("posts")
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Public()
  @Get()
  findAll(): Promise<PostsRO> {
    return this.postService.findAll();
  }

  @Public()
  @Get(":slug")
  findOne(@Param("slug", SlugValidationPipe) slug: string): Promise<PostRO> {
    return this.postService.findOne(slug);
  }

  @Post()
  @RequirePermissions(Permission.CREATE_ARTICLE)
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
