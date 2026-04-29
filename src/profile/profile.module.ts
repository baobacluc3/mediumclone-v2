import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";
import { UserEntity } from "../user/user.entity";
import { FollowsEntity } from "./follows.entity";
import { UserModule } from "../user/user.module";
import { AuthMiddleware } from "../user/auth.middleware";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, FollowsEntity]), UserModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: "profiles/:username/follow", method: RequestMethod.POST },
        { path: "profiles/:username/follow", method: RequestMethod.DELETE },
      );
  }
}
