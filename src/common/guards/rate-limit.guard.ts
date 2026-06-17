import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";

import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from "@/common/decorators/rate-limit.decorator";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly attempts = new Map<string, RateLimitRecord>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.buildKey(context, request);
    const now = Date.now();
    const current = this.attempts.get(key);

    if (!current || current.resetAt <= now) {
      this.attempts.set(key, {
        count: 1,
        resetAt: now + options.ttlMs,
      });
      return true;
    }

    if (current.count >= options.limit) {
      throw new HttpException(
        "Too many requests. Please try again later.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    current.count += 1;
    return true;
  }

  private buildKey(context: ExecutionContext, request: Request): string {
    const handlerName = context.getHandler().name;
    const ip =
      request.ip ||
      request.socket.remoteAddress ||
      request.headers["x-forwarded-for"] ||
      "unknown";

    return `${handlerName}:${String(ip)}`;
  }
}
