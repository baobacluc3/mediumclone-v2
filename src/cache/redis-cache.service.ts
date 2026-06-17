import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, RedisClientType } from "redis";

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: RedisClientType | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const enabled = this.configService.get<string>("CACHE_ENABLED") !== "false";

    if (!enabled) {
      this.logger.log("Redis cache is disabled by CACHE_ENABLED=false");
      return;
    }

    this.client = createClient({
      url:
        this.configService.get<string>("REDIS_URL") ?? "redis://localhost:6379",
      socket: {
        reconnectStrategy: false,
      },
    });

    this.client.on("error", (error) => {
      this.logger.warn(`Redis cache error: ${error.message}`);
    });

    try {
      await this.client.connect();
      this.logger.log("Connected to Redis cache");
    } catch (error) {
      this.logger.warn(
        `Redis cache unavailable; continuing without cache. ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const client = this.getClient();

    if (!client) {
      return null;
    }

    const cached = await client.get(key);

    if (!cached) {
      return null;
    }

    try {
      return JSON.parse(String(cached)) as T;
    } catch {
      await this.del(key);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const client = this.getClient();

    if (!client) {
      return;
    }

    await client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  }

  async remember<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const freshValue = await loader();
    await this.set(key, freshValue, ttlSeconds);
    return freshValue;
  }

  async del(...keys: string[]): Promise<void> {
    const client = this.getClient();

    if (!client || keys.length === 0) {
      return;
    }

    await client.del(keys);
  }

  async deleteByPattern(pattern: string): Promise<void> {
    const client = this.getClient();

    if (!client) {
      return;
    }

    const keys: string[] = [];

    for await (const key of client.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      if (Array.isArray(key)) {
        keys.push(...key.map(String));
      } else {
        keys.push(String(key));
      }
    }

    await this.del(...keys);
  }

  private getClient(): RedisClientType | null {
    if (!this.client?.isReady) {
      return null;
    }

    return this.client;
  }
}
