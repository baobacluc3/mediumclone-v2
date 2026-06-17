import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PostEntity } from "../posts/post.entity";
import { UserEntity } from "../user/user.entity";
import { CommentEntity } from "./comment.entity";
import { CommentController } from "./comment.controller";
import { CommentService } from "./comment.service";
import { CommentPolicy } from "./policies/comment.policy";

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity, PostEntity, UserEntity])],
  controllers: [CommentController],
  providers: [CommentService, CommentPolicy],
})
export class CommentModule {}
