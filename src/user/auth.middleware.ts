import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { UserService } from "./user.service";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpException("Not authorized.", HttpStatus.UNAUTHORIZED);
    }

    const token = authHeader.split(" ")[1];

    let decoded: { id: number };
    try {
      const secret = this.configService.getOrThrow<string>("JWT_SECRET");
      decoded = jwt.verify(token, secret) as { id: number };
    } catch (err) {
      // Distinguish expired vs malformed tokens for clearer error messages
      if (err instanceof jwt.TokenExpiredError) {
        throw new HttpException("Token has expired.", HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException("Invalid token.", HttpStatus.UNAUTHORIZED);
    }

    const userRO = await this.userService.findById(decoded.id);
    req.user = userRO.user;
    next();
  }
}
