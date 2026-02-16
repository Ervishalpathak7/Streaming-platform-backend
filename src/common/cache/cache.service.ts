import Redis from "ioredis";
import { config } from "../config/config";
import { logger } from "../logger/logger";
import { User, Video } from "@prisma/client";

class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 3,
    });

    this.redis.on("error", (err) => {
      logger.error({ err }, "Redis Client Error");
    });

    this.redis.on("connect", () => {
      logger.info("Redis Client Connected");
    });
  }

  async setUser(value: User): Promise<void> {
    try {
      await this.redis.set(
        `user:${value.id}`,
        JSON.stringify(value),
        "EX",
        3600,
      );
    } catch (err) {
      logger.error({ err, key: `user:${value.id}` }, "Cache Set Error");
    }
  }

  // Cache User data
  async getUser(id: string): Promise<User | null> {
    try {
      const data = await this.redis.get(`user:${id}`);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error({ err, key: `user:${id}` }, "Cache Get Error");
      return null;
    }
  }

  async delUser(id: string): Promise<void> {
    try {
      await this.redis.del(`user:${id}`);
    } catch (err) {
      logger.error({ err, key: `user:${id}` }, "Cache Delete Error");
    }
  }

  // Cache Video data
  async setVideo(value: Video, ttlSeconds: number = 300): Promise<void> {
    try {
      await this.redis.set(
        `video:${value.id}`,
        JSON.stringify(value),
        "EX",
        ttlSeconds,
      );
    } catch (err) {
      logger.error({ err, key: `video:${value.id}` }, "Cache Set Error");
    }
  }

  async getVideo(id: string): Promise<Video | null> {
    try {
      const data = await this.redis.get(`video:${id}`);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error({ err, key: `video:${id}` }, "Cache Get Error");
      return null;
    }
  }

  async delVideo(id: string): Promise<void> {
    try {
      await this.redis.del(`video:${id}`);
    } catch (err) {
      logger.error({ err, key: `video:${id}` }, "Cache Delete Error");
    }
  }

  // Cache Idempotency Key data
  async setIdempotencyKey(
    value: string,
    ttlSeconds: number = 300,
  ): Promise<void> {
    try {
      await this.redis.set(
        `idempotencyKey:${value}`,
        JSON.stringify(value),
        "EX",
        ttlSeconds,
      );
    } catch (err) {
      logger.error({ err, key: `idempotencyKey:${value}` }, "Cache Set Error");
    }
  }

  async getIdempotencyKey(id: string): Promise<string | null> {
    try {
      const data = await this.redis.get(`idempotencyKey:${id}`);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error({ err, key: `idempotencyKey:${id}` }, "Cache Get Error");
      return null;
    }
  }

  async delIdempotencyKey(id: string): Promise<void> {
    try {
      await this.redis.del(`idempotencyKey:${id}`);
    } catch (err) {
      logger.error({ err, key: `idempotencyKey:${id}` }, "Cache Delete Error");
    }
  }

  // Generic get/set methods
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error({ err, key }, "Cache Get Error");
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (err) {
      logger.error({ err, key }, "Cache Set Error");
    }
  }

  async deleteMatch(pattern: string): Promise<void> {
    const stream = this.redis.scanStream({
      match: pattern,
      count: 100,
    });

    stream.on("data", (keys) => {
      if (keys.length) {
        const pipeline = this.redis.pipeline();
        keys.forEach((key: string) => {
          pipeline.del(key);
        });
        pipeline.exec();
      }
    });

    stream.on("end", () => {
      // scan complete
    });
  }

  async quit(): Promise<void> {
    await this.redis.quit();
  }
}

export const cacheService = new CacheService();
