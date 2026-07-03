import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RateLimitGuard } from "@/common/guards/rate-limit.guard";
import { PostEntity } from "../posts/post.entity";
import { CommentController } from "./comment.controller";
import { CommentEntity } from "./comment.entity";
import { CommentService } from "./comment.service";

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity, PostEntity])],
  providers: [CommentService, RateLimitGuard],
  controllers: [CommentController],
})
export class CommentModule {}
