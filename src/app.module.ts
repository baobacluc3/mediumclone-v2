import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { ArticleModule } from "./article/article.module";
import { UserModule } from "./user/user.module";
import { ProfileModule } from "./profile/profile.module";
import { TagModule } from "./tag/tag.module";

@Module({
  imports: [
    // Load .env vào toàn bộ app — không cần hardcode config
    ConfigModule.forRoot({ isGlobal: true }),

    // TypeORM dùng async config để đọc từ env
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get<string>("DB_HOST", "localhost"),
        port: config.get<number>("DB_PORT", 5432),
        username: config.get<string>("DB_USER", "postgres"),
        password: config.get<string>("DB_PASS", ""),
        database: config.get<string>("DB_NAME", "realworld"),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        migrations: [__dirname + "/migrations/*{.ts,.js}"],
        synchronize: config.get<string>("NODE_ENV") !== "production",
        logging: config.get<string>("NODE_ENV") === "development",
      }),
    }),

    ArticleModule,
    UserModule,
    ProfileModule,
    TagModule,
  ],
  controllers: [AppController],
})
export class ApplicationModule {}
