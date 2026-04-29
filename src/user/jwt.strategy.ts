import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthenticatedUser, JwtUserPayload } from "./auth.types";
import { UserService } from "./user.service";

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
      const user = await this.userService.findEntityById(payload.id);

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio ?? "",
        image: user.image ?? "",
      };
    } catch {
      throw new UnauthorizedException("Invalid token.");
    }
  }
}
