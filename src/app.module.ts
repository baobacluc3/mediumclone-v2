import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostModule } from "./posts/post.module";
import { getTypeOrmOptions } from "./database/typeorm.config";
import { ProfileModule } from "./profile/profile.module";
import { TagModule } from "./tag/tag.module";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { RedisCacheModule } from "./cache/redis-cache.module";
import { AuthorizationModule } from "./auth/authorization/authorization.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { AccessControlGuard } from "./auth/authorization/access-control.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisCacheModule,
    TypeOrmModule.forRoot(getTypeOrmOptions()),
    UserModule,
    PostModule,
    ProfileModule,
    TagModule,
    AuthModule,
    AuthorizationModule,
  ],
  providers: [
    //Every route requires a valid JWT unless marked @Public(). Registration
    //order matters: authentication must run before authorization.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: AccessControlGuard },
  ],
})
export class ApplicationModule {}
