import Redis from "ioredis";
import { config } from "../config/config";
import { logger } from "../logger/logger";

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

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (err) {
      logger.error({ err, key }, "Cache Set Error");
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error({ err, key }, "Cache Get Error");
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      logger.error({ err, key }, "Cache Delete Error");
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
