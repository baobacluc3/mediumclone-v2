import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "./cache/cache.module";
import { PostModule } from "./posts/post.module";
import { CommentModule } from "./comments/comment.module";
import { getTypeOrmOptions } from "./database/typeorm.config";
import { ProfileModule } from "./profile/profile.module";
import { TagModule } from "./tag/tag.module";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { AuthorizationModule } from "./authorization/authorization.module";
import { MailModule } from "./mail/mail.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule,
    MailModule,
    TypeOrmModule.forRoot(getTypeOrmOptions()),
    HealthModule,
    AuthorizationModule,
    UserModule,
    PostModule,
    CommentModule,
    ProfileModule,
    TagModule,
    AuthModule,
  ],
})
export class ApplicationModule {}
