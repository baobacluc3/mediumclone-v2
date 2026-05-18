import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArticleModule } from "./modules/article/article.module";
import { HealthController } from "./health.controller";
import { getTypeOrmOptions } from "./database/typeorm.config";
import { ProfileModule } from "./modules/profile/profile.module";
import { TagModule } from "./modules/tag/tag.module";
import { UserModule } from "./modules/user/user.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(getTypeOrmOptions()),
    UserModule,
    ArticleModule,
    ProfileModule,
    TagModule,
  ],
  controllers: [HealthController],
})
export class ApplicationModule {}
