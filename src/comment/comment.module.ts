import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Comment } from "../post/comment.entity";
import { PostEntity } from "../post/post.entity";
import { UserEntity } from "../user/user.entity";
import { CommentController } from "./comment.controller";
import { CommentService } from "./comment.service";

@Module({
  imports: [TypeOrmModule.forFeature([Comment, PostEntity, UserEntity])],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
