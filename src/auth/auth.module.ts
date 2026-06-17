import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserModule } from "../user/user.module";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "@/user/user.entity";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RateLimitGuard } from "@/common/guards/rate-limit.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    UserModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("JWT_SECRET"),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RateLimitGuard],
  exports: [AuthService],
})
export class AuthModule {}
