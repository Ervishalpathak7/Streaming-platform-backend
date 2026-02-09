import mongoose from "mongoose";
import redisClient from "@/config/redis.js";
import logger from "@/lib/winston.js";
import { disconnectDb } from "@/config/mongoDb.js";
import serverInstance from "@/index.js";

export const gracefullShutdown = async () => {
  try {
    logger.info("Graceful shutdown initiated");

    // disconnectDb
    if (mongoose.connection.readyState === 1) await disconnectDb();
    logger.info("MongoDB disconnected");

    // disconnectCache
    if (redisClient && redisClient.status === "ready") {
      await redisClient.quit();
      logger.info("Redis disconnected");
    }
  } catch (err) {
    logger.error("Graceful shutdown failed", {
      category: "server",
      service: "app",
      lifecycle: "process",
      code: "GRACEFUL_SHUTDOWN_FAILED",
      err,
    });
  } finally {
    if (serverInstance) {
      serverInstance.close(() => {
        logger.info("Server shut down gracefully");
        process.exit(0);
      });
    } else {
      logger.info("Server shut down gracefully");
      process.exit(0);
    }
  }
};
