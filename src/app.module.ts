import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArticleModule } from "./article/article.module";
import { AppController } from "./app.controller";
import { getTypeOrmOptions } from "./database/typeorm.config";
import { ProfileModule } from "./profile/profile.module";
import { TagModule } from "./tag/tag.module";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(getTypeOrmOptions()),
    ArticleModule,
    UserModule,
    ProfileModule,
    TagModule,
  ],
  controllers: [AppController],
})
export class ApplicationModule {}
