import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthenticatedUser, JwtUserPayload } from "./auth.types";
import { UserService } from "../user/user.service";
import { UserRole } from "./types/auth-user.type";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_SECRET"),
    });
  }

  async validate(payload: JwtUserPayload): Promise<AuthenticatedUser> {
    try {
      if (payload.tokenType && payload.tokenType !== "access") {
        throw new UnauthorizedException("Invalid token.");
      }

      const userId = payload.id ?? payload.sub;
      if (!userId) {
        throw new UnauthorizedException("Invalid token.");
      }

      const user = await this.userService.findEntityById(userId);

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio ?? "",
        image: user.image ?? "",
        roles: user.roles?.length ? user.roles : [UserRole.USER],
      };
    } catch {
      throw new UnauthorizedException("Invalid token.");
    }
  }
}

/*
Mỗi khi client gửi request có kèm JWT token, file này sẽ:

Trích xuất token từ header
Xác minh token có hợp lệ không
Tìm user trong database theo thông tin trong token
Trả về thông tin user để các route tiếp theo sử dụng
*/
