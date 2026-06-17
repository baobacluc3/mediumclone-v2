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

import { CreateCommentDto } from "../posts/dto";
import { CommentsRO } from "../posts/post.interface";
import { User } from "../common/decorators/user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { ParsePositiveIntPipe } from "../common/pipes/parse-positive-int.pipe";
import { SlugValidationPipe } from "../common/pipes/slug-validation.pipe";
import { CommentService } from "./comment.service";
import { AuthenticatedUser } from "@/auth/auth.types";

@Controller("posts/:slug/comments")
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  findComments(
    @Param("slug", SlugValidationPipe) slug: string,
  ): Promise<CommentsRO> {
    return this.commentService.findComments(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createComment(
    @User("id") userId: number,
    @Param("slug", SlugValidationPipe) slug: string,
    @Body("comment") dto: CreateCommentDto,
  ): Promise<CommentsRO> {
    return this.commentService.createComment(slug, userId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  deleteComment(
    @User() user: AuthenticatedUser,
    @Param("slug", SlugValidationPipe) slug: string,
    @Param("id", ParsePositiveIntPipe) id: number,
  ): Promise<CommentsRO> {
    return this.commentService.deleteComment(slug, id, user);
  }
}
