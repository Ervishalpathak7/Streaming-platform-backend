import mongoose from "mongoose";
import { disconnectDb } from "../database/index.js";
import { server } from "../index.js";
import { logger } from "./winston.js";

export const gracefullShutdown = async () => {
  try {
    if (mongoose.connection.readyState == 1) await disconnectDb();
  } catch (error) {
    logger.error(`Error while db closing : ${err?.message}`, {
      stack: err?.stack,
    });
  } finally {
    server.close(() => {
      logger.info("Server is Shutting down gracefully");
      process.exit(1);
    });
  }
};
