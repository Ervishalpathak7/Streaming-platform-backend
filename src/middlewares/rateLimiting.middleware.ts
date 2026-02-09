import { RateLimiterRedis } from "rate-limiter-flexible";
import logger from "@/lib/winston.js";
import redisClient from "@/config/redis.js";
import { middleware } from "@/trpc/trpc.js";
import { TRPCError } from "@trpc/server";

const getRouteLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:get",
  points: 100, // 100 requests
  duration: 60, // per minute
});
const uploadRouteLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:upload",
  points: 10, // 10 uploads
  duration: 60, // per minute
});
const authRouteLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:auth",
  points: 10, // 10 attempts
  duration: 15 * 60, // per 15 minutes
});

export const rateLimitMiddleware = middleware(async ({ ctx, next, path }) => {
  const ip = ctx.ip;
  try {
    if (ip) {
      if (path.startsWith("get")) {
        await getRouteLimiter.consume(ip);
      } else if (path.startsWith("upload")) {
        await uploadRouteLimiter.consume(ip);
      } else if (path.startsWith("auth")) {
        await authRouteLimiter.consume(ip);
      }
    }
  } catch (rejRes) {
    logger.warn(`Rate limit exceeded for IP: ${ip} on route: ${path}`);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Please try again later.",
    });
  }
  return next();
});
