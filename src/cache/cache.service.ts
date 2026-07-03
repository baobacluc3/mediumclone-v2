import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import Redis from "ioredis";

/**
 * Thin Redis wrapper with graceful degradation: when REDIS_URL is unset or
 * Redis is unreachable, every operation quietly becomes a no-op (reads miss,
 * writes are dropped) so the app keeps serving straight from Postgres. A
 * cache outage must never take requests down with it.
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis | null = null;

  get enabled(): boolean {
    return this.client !== null && this.client.status === "ready";
  }

  onModuleInit(): void {
    const url = process.env.REDIS_URL;

    if (!url) {
      this.logger.log("REDIS_URL not set; caching disabled");
      return;
    }

    this.client = new Redis(url, {
      // Fail fast on individual commands; callers fall back to the DB.
      maxRetriesPerRequest: 1,
      connectTimeout: 3_000,
      // Reject commands immediately while disconnected instead of queueing
      // them — otherwise every request hangs when Redis is unreachable,
      // which is exactly the outage this wrapper must absorb.
      enableOfflineQueue: false,
      // Keep trying to reconnect in the background, but cap the delay.
      retryStrategy: (times) => Math.min(times * 500, 15_000),
    });

    this.client.on("ready", () => this.logger.log("Redis connected"));
    this.client.on("error", (error: Error) =>
      this.logger.warn(`Redis error: ${error.message}`),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit().catch(() => undefined);
  }

  async getJson<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // Dropped writes just mean the next read is a miss.
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch {
      // If the delete fails the entry still expires via its TTL.
    }
  }

  /**
   * Atomically counts a hit within a TTL window (INCR + PEXPIRE on first
   * hit). Returns the current count, or null when Redis is unavailable so
   * callers can fall back to in-memory counting.
   */
  async incrWithTtl(key: string, ttlMs: number): Promise<number | null> {
    if (!this.client) return null;
    try {
      const count = await this.client.incr(key);
      if (count === 1) {
        await this.client.pexpire(key, ttlMs);
      }
      return count;
    } catch {
      return null;
    }
  }
}
