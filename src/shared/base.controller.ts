import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

interface JwtPayload {
  id: number;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class BaseController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  protected getUserIdFromToken(authorization: string | undefined): number {
    if (!authorization) {
      throw new UnauthorizedException("Authorization header is missing");
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      throw new UnauthorizedException(
        "Invalid authorization format. Use: Bearer <token>",
      );
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });
      return payload.id;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  protected decodeToken(authorization: string | undefined): JwtPayload {
    if (!authorization) {
      throw new UnauthorizedException("Authorization header is missing");
    }
    const token = authorization.split(" ")[1];
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
