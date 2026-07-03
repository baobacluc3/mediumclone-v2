import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";

import { CacheService } from "@/cache/cache.service";
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from "@/common/decorators/rate-limit.decorator";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

/**
 * Counts hits per handler+IP within a TTL window. Counters live in Redis when
 * available — so limits survive restarts and are shared across instances —
 * and fall back to an in-process Map otherwise.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly attempts = new Map<string, RateLimitRecord>();

  constructor(
    private readonly reflector: Reflector,
    private readonly cache: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.buildKey(context, request);

    const redisCount = await this.cache.incrWithTtl(
      `ratelimit:${key}`,
      options.ttlMs,
    );

    const count =
      redisCount !== null ? redisCount : this.countInMemory(key, options);

    if (count > options.limit) {
      throw new HttpException(
        "Too many requests. Please try again later.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /** In-process fallback used when Redis is not configured or unreachable. */
  private countInMemory(key: string, options: RateLimitOptions): number {
    const now = Date.now();
    const current = this.attempts.get(key);

    if (!current || current.resetAt <= now) {
      this.attempts.set(key, { count: 1, resetAt: now + options.ttlMs });
      return 1;
    }

    current.count += 1;
    return current.count;
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
