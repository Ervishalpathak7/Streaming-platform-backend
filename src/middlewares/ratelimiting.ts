import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";
import redisClient from "@/config/redis.js";
import type { Request, Response, NextFunction } from "express";
import logger from "@/lib/winston";

export const getRouteLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:get",
  points: 100, // 100 requests
  duration: 60, // per minute
});

export const uploadRouteLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:upload",
  points: 10, // 10 uploads
  duration: 60, // per minute
});

export const authRouteLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:auth",
  points: 10, // 10 attempts
  duration: 15 * 60, // per 15 minutes
});

const keyGenerators = {
  GET: (req: any) => req.userId || req.ip,
  UPLOAD: (req: any) => req.userId || req.ip,
  AUTH: (req: any) => req.ip,
};

export const rateLimitMiddleware = (
  limiter: RateLimiterRedis,
  method: "GET" | "UPLOAD" | "AUTH",
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerators[method](req);
      await limiter.consume(key);
      next();
    } catch (error) {
      if (error instanceof RateLimiterRes) {
        return res.status(429).json({
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(error.msBeforeNext / 1000),
        });
      }
      if (error instanceof Error) {
        logger.error(`Rate limiting error: ${error.message}`);
      } else {
        logger.error(`Rate limiting error: ${error}`);
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};
