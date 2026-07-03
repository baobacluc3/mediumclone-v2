import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";

import { AuthenticatedUser } from "@/auth/auth.types";
import { Public } from "@/authorization/decorators/public.decorator";
import { RequirePermissions } from "@/authorization/decorators/require-permissions.decorator";
import { Action } from "@/authorization/domain/action.enum";
import { AppSubject } from "@/authorization/domain/app-subject.enum";
import { RateLimit } from "@/common/decorators/rate-limit.decorator";
import { User } from "@/common/decorators/user.decorator";
import { RateLimitGuard } from "@/common/guards/rate-limit.guard";
import { ParsePositiveIntPipe } from "../common/pipes/parse-positive-int.pipe";
import { RequiredBodyPipe } from "@/common/pipes/required-body.pipe";
import { SlugValidationPipe } from "../common/pipes/slug-validation.pipe";
import { CommentService } from "./comment.service";
import { CommentRO, CommentsRO } from "./comment.interface";
import { CreateCommentDto } from "./dto";

@Controller("posts/:slug/comments")
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @Public()
  findByPost(
    @Param("slug", SlugValidationPipe) slug: string,
  ): Promise<CommentsRO> {
    return this.commentService.findByPost(slug);
  }

  @Post()
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 20, ttlMs: 60_000 })
  @RequirePermissions({ action: Action.Create, subject: AppSubject.Comment })
  create(
    @User("id") userId: number,
    @Param("slug", SlugValidationPipe) slug: string,
    @Body("comment", new RequiredBodyPipe("comment")) dto: CreateCommentDto,
  ): Promise<CommentRO> {
    return this.commentService.create(userId, slug, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  async delete(
    @User() user: AuthenticatedUser,
    @Param("slug", SlugValidationPipe) slug: string,
    @Param("id", ParsePositiveIntPipe) id: number,
  ): Promise<void> {
    await this.commentService.delete(user, slug, id);
  }
}
