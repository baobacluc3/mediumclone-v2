import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PostController } from "./post.controller";
import { PostService } from "./post.service";
import { PostEntity } from "./post.entity";
import { UserEntity } from "../user/user.entity";
import { FollowsEntity } from "../profile/follows.entity";
import { UserModule } from "../user/user.module";
import { TagEntity } from "../tag/tag.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostEntity,
      UserEntity,
      FollowsEntity,
      TagEntity,
    ]),
    UserModule,
  ],
  providers: [PostService],
  controllers: [PostController],
})
export class PostModule {}
