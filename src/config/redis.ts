import { Redis } from "ioredis";
import type { Redis as RedisClient } from "ioredis";
import type { Types } from "mongoose";
import type { Video } from "@/models/video.model.js";
import logger from "@/lib/winston.js";

const VIDEO_CACHE_PREFIX = "video";
const VIDEO_PROCESSING_TTL = 30; // 30 seconds
const VIDEO_READY_TTL = 60 * 60 * 6; // 6 hours

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_HOST or REDIS_URL environment variable is not set");
}

const redisClient: RedisClient = new Redis(process.env.REDIS_URL);

redisClient.on("connect", () => {
  logger.info("Redis connecting...");
});

redisClient.on("ready", () => {
  logger.info("Redis ready");
});

redisClient.on("error", (err: Error) => {
  logger.error("Redis error", {
    service: "cache",
    message: err.message,
    stack: err.stack,
  });
});

redisClient.on("close", () => {
  logger.warn("Redis connection closed");
});

redisClient.on("reconnecting", () => {
  logger.warn("Redis reconnecting");
});


export default redisClient;
