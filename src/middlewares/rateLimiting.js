import { RateLimiterRedis } from "rate-limiter-flexible";
import redisClient from "../cache/index.js";
import { logger } from "../utils/winston.js";

export const getRouteLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:get",
  points: 100, // 100 requests
  duration: 60, // per minute
});

export const uploadRouteLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:upload",
  points: 5, // 5 uploads
  duration: 60 * 60, // per hour
});

export const authRouteLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:auth",
  points: 10, // 5 attempts
  duration: 15 * 60, // per 15 minutes
});

export const rateLimitMiddleware = (limiter, keyGenerator) => {
  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      console.log(key);
      await limiter.consume(key);
      next();
    } catch (err) {
      if (err.remainingPoints !== undefined) {
        return res.status(429).json({
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(err.msBeforeNext / 1000),
        });
      }
      logger.error("Rate limiter internal error", err);
      return next();
    }
  };
};
