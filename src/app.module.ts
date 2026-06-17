import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostModule } from "./posts/post.module";
import { getTypeOrmOptions } from "./database/typeorm.config";
import { ProfileModule } from "./profile/profile.module";
import { TagModule } from "./tag/tag.module";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { RedisCacheModule } from "./cache/redis-cache.module";

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
  ],
})
export class ApplicationModule {}
