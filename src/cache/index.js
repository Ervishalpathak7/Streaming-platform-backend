import { logger } from "../utils/winston.js";
import Redis from "ioredis";

const VIDEO_CACHE_PREFIX = "video";
const VIDEO_PROCESSING_TTL = 30; // 30 seconds
const VIDEO_READY_TTL = 60 * 60 * 6; // 6 hour
let redisClient;

export const connectRedis = (REDIS_URL) => {
  redisClient = new Redis(REDIS_URL);
  redisClient.on("connect", () => {
    logger.info("Redis connecting...");
  });

  redisClient.on("ready", () => {
    logger.info("Redis ready");
  });

  redisClient.on("error", (err) => {
    logger.error("Redis error", {
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
  return redisClient;
};

export const getRedis = () => redisClient;

export const waitForRedis = () =>
  new Promise((resolve, reject) => {
    if (redisClient.status === "ready") {
      return resolve();
    }
    redisClient.once("ready", resolve);
    redisClient.once("error", reject);
  });
export const disconnectCache = async () => {
  if (redisClient) await redisClient.quit();
};
export const saveVideoData = async (
  videoId,
  status,
  title,
  url = null,
  thumbnail = null,
) => {
  const key = `${VIDEO_CACHE_PREFIX}:${videoId}`;

  if (status === "PROCESSING") {
    const payload = JSON.stringify({ status, title });

    await redisClient.set(key, payload, "EX", VIDEO_PROCESSING_TTL);

    logger.info("Video data cached (PROCESSING)", { videoId });
    return;
  }

  if (status === "READY") {
    const payload = JSON.stringify({
      status,
      title,
      url,
      thumbnail,
    });

    await redisClient.set(key, payload, "EX", VIDEO_READY_TTL);

    logger.info("Video data cached (READY)", { videoId });
    return;
  }

  await redisClient.del(key);
  logger.warn("Video cache invalidated", { videoId, status });
};

export const getVideoData = async (videoId) => {
  const key = `${VIDEO_CACHE_PREFIX}:${videoId}`;
  const cached = await redisClient.get(key);
  return cached ? JSON.parse(cached) : null;
};

export default redisClient;