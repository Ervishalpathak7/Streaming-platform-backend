import mongoose from "mongoose";
import { disconnectDb } from "../database/index.js";
import { server } from "../index.js";
import { logger } from "./winston.js";
import { disconnectCache } from "../cache/index.js";

export const gracefullShutdown = async () => {
  try {
    logger.info("Graceful shutdown initiated");

    if (mongoose.connection.readyState === 1) {
      await disconnectDb();
      logger.info("MongoDB disconnected");
    }

    await disconnectCache();
    
  } catch (err) {
    logger.error("Error during graceful shutdown", {
      message: err.message,
      stack: err.stack,
    });
  } finally {
    if (server) {
      server.close(() => {
        logger.info("Server shut down gracefully");
        process.exit(0); 
      });
    } else {
      process.exit(0);
    }
  }
};
