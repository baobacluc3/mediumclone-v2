import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthenticatedUser, JwtUserPayload } from "./auth.types";
import { UserService } from "../user/user.service";
import { DEFAULT_ROLE_NAME } from "@/authorization/domain/rbac.catalog";

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
      const roles = user.roles?.length
        ? user.roles.map((role) => role.name)
        : [DEFAULT_ROLE_NAME];

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio ?? "",
        image: user.image ?? "",
        roles,
      };
    } catch {
      throw new UnauthorizedException("Invalid token.");
    }
  }
}
