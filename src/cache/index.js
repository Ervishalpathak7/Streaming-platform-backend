import { createClient } from "redis";
import { logger } from "../utils/winston.js";

const VIDEO_CACHE_PREFIX = "video";
const VIDEO_PROCESSING_TTL = 30; // 30 seconds
const VIDEO_READY_TTL = 60 * 60 * 6; // 6 hour
let redisClient;

export const connectCache = async () => {
  redisClient = createClient({ url: process.env.REDIS_URL });

  redisClient.on("error", (err) => {
    logger.error("Redis Client Error", {
      message: err.message,
      stack: err.stack,
    });
  });

  await redisClient.connect();
  logger.info("Redis connected");
};

export const disconnectCache = async () => {
  if (redisClient) {
    await redisClient.close();
    logger.info("Redis disconnected");
  }
};

export const saveVideoData = async (
  videoId,
  status,
  title,
  url = null,
  thumbnail = null
) => {
  const key = `${VIDEO_CACHE_PREFIX}:${videoId}`;

  if (status === "PROCESSING") {
    const payload = JSON.stringify({ status, title });
    await redisClient.set(key, payload, { EX: VIDEO_PROCESSING_TTL });
    logger.info("Video Data Saved in Cache", videoId);
    return;
  }

  if (status === "READY") {
    const payload = JSON.stringify({ status, title, url, thumbnail });
    await redisClient.set(key, payload, { EX: VIDEO_READY_TTL });
    logger.info("Video Data Updated in Cache", videoId);
    return;
  }

  await redisClient.del(key);
  logger.error("Video Data Invalidate in cache", videoId);
};

export const getVideoData = async (videoId) => {
  const key = `${VIDEO_CACHE_PREFIX}:${videoId}`;
  const cached = await redisClient.get(key);
  return cached ? JSON.parse(cached) : null;
};
