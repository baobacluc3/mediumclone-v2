import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Comment } from "../article/comment.entity";
import { ArticleEntity } from "../article/article.entity";
import { UserEntity } from "../user/user.entity";
import { CommentController } from "./comment.controller";
import { CommentService } from "./comment.service";

@Module({
  imports: [TypeOrmModule.forFeature([Comment, ArticleEntity, UserEntity])],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
