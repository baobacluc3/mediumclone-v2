import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArticleModule } from "./modules/article/article.module";
import { HealthController } from "./health.controller";
import { getTypeOrmOptions } from "./database/typeorm.config";
import { ProfileModule } from "../src/modules/profile";
import { TagModule } from "./tag/tag.module";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(getTypeOrmOptions()),
    UserModule,
    ArticleModule,
    ProfileModule,
    TagModule,
    AuthModule,
  ],
  controllers: [HealthController],
})
export class ApplicationModule {}
