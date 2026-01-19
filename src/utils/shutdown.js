import mongoose from "mongoose";
import { disconnectDb } from "../database/index.js";
import { server } from "../index.js";
import { logger } from "./winston.js";
import { disconnectCache, getRedis } from "../cache/index.js";

export const gracefullShutdown = async () => {
  try {
    logger.info("Graceful shutdown initiated");

    // disconnectDb
    if (mongoose.connection.readyState === 1) await disconnectDb();
    logger.info("MongoDB disconnected");

    // disconnectCache
    if (getRedis()) await disconnectCache();
    logger.info("Redis disconnected");

  } catch (err) {
    logger.error("Graceful shutdown failed", {
      category: "server",
      service: "app",
      lifecycle: "process",
      code: "GRACEFUL_SHUTDOWN_FAILED",
      err,
    });
  } finally {
    if (server) {
      server.close(() => {
        logger.info("Server shut down gracefully");
        process.exit(0);
      });
    } else {
      logger.info("Server shut down gracefully");
      process.exit(0);
    }
  }
};
