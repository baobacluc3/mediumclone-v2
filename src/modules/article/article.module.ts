import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ArticleController } from "./controllers/article.controller";
import { ArticleService } from "./services/article.service";
import { ArticleEntity } from "./entities/article.entity";
import { Comment } from "./entities/comment.entity";
import { UserEntity } from "../user/entities/user.entity";
import { FollowsEntity } from "../profile/entities/follows.entity";
import { UserModule } from "../user/user.module";
import { TagEntity } from "../tag/entities/tag.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ArticleEntity,
      Comment,
      UserEntity,
      FollowsEntity,
      TagEntity,
    ]),
    UserModule,
  ],
  providers: [ArticleService],
  controllers: [ArticleController],
})
export class ArticleModule {}
