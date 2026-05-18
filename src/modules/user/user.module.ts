import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from "../../common/guards/jwt-auth.guard";
import { JwtStrategy } from "../../auth/jwt.strategy";
import { UserController } from "./controllers/user.controller";
import { UserEntity } from "./entities/user.entity";
import { UserService } from "./services/user.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    ConfigModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("JWT_SECRET"),
        signOptions: { expiresIn: "7d" },
      }),
    }),
  ],
  providers: [UserService, JwtStrategy, JwtAuthGuard, OptionalJwtAuthGuard],
  controllers: [UserController],
  exports: [UserService, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class UserModule {}
