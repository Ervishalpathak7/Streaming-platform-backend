import { RateLimiterRedis } from "rate-limiter-flexible";
import { getRedis } from "../cache/index.js";
import { logger } from "../utils/winston.js";

let getRouteLimiter;
let authRouteLimiter;
let uploadRouteLimiter;

export const rateLimitstart = () => {
  let redisClient = getRedis();
  getRouteLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "rl:get",
    points: 100, // 100 requests
    duration: 60, // per minute
  });
  uploadRouteLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "rl:upload",
    points: 500, // 500 uploads
    duration: 60 , // per minute
  });

  authRouteLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "rl:auth",
    points: 10, // 5 attempts
    duration: 15 * 60, // per 15 minutes
  });
};

export const rateLimitMiddleware = (limiterKey, keyGenerator) => {
  return async (req, res, next) => {
    try {
      let limiter;
      const key = keyGenerator(req);
      if (limiterKey === "AUTH") limiter = authRouteLimiter;
      if (limiterKey === "UPLOAD") limiter = uploadRouteLimiter;
      if (limiterKey === "GET") limiter = getRouteLimiter;
      await limiter.consume(key);
      next();
    } catch (error) {
      if (error.remainingPoints !== undefined) {
        return res.status(429).json({
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(error.msBeforeNext / 1000),
        });
      }
      logger.error("Rate limiter internal failure", {
        category: "server",
        service: "rate-limiting",
        lifecycle: "request",
        code: "RATE_LIMITER_INTERNAL_ERROR",
        error,
      });
      return next();
    }
  };
};

