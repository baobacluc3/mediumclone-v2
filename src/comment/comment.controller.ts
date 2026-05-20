import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CreateCommentDto } from "../article/dto";
import { CommentsRO } from "../article/article.interface";
import { User } from "../common/decorators/user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CommentService } from "./comment.service";

@Controller("articles/:slug/comments")
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  findComments(@Param("slug") slug: string): Promise<CommentsRO> {
    return this.commentService.findComments(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createComment(
    @User("id") userId: number,
    @Param("slug") slug: string,
    @Body("comment") dto: CreateCommentDto,
  ): Promise<CommentsRO> {
    return this.commentService.createComment(slug, userId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  deleteComment(
    @User("id") userId: number,
    @Param("slug") slug: string,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<CommentsRO> {
    return this.commentService.deleteComment(slug, id, userId);
  }
}
