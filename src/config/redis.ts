import { Redis } from "ioredis";
import type { Redis as RedisClient } from "ioredis";
import logger from "@/lib/winston.js";

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
