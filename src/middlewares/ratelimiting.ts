import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";
import redisClient from "@/config/redis.js";
import type { Request, Response, NextFunction } from "express";
import logger from "@/lib/winston.js";
import { normalizeError } from "@/error/index.js";
import { InternalServerError } from "@/error/errors.js";
import { RATE_LIMIT_CONFIG } from "@/config/constants.js";

export const getRouteLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:get",
  points: RATE_LIMIT_CONFIG.GET.POINTS,
  duration: RATE_LIMIT_CONFIG.GET.DURATION,
});

export const uploadRouteLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:upload",
  points: RATE_LIMIT_CONFIG.UPLOAD.POINTS,
  duration: RATE_LIMIT_CONFIG.UPLOAD.DURATION,
});

export const authRouteLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:auth",
  points: RATE_LIMIT_CONFIG.AUTH.POINTS,
  duration: RATE_LIMIT_CONFIG.AUTH.DURATION,
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
      logger.error("Error in rate limiting middleware", {
        method,
        key: keyGenerators[method](req),
        req: {
          method: req.method,
          url: req.url,
          headers: req.headers,
        },
        error: normalizeError(error),
      });
      throw new InternalServerError(
        "Error in rate limiting middleware",
        normalizeError(error),
      );
    }
  };
};
