import mongoose from "mongoose";
import { disconnectDb } from "../database/index.js";
import { server } from "../index.js";
import { logger } from "./winston.js";
import { disconnectCache } from "../cache/index.js";

export const gracefullShutdown = async () => {
  try {
    if (mongoose.connection.readyState == 1) await disconnectDb();
    await disconnectCache();
  } catch (err) {
    logger.error(`Error in Gracefull Shutdown : ${err?.message}`, {
      stack: err?.stack,
    });
  } finally {
    if (server)
      server.close(() => {
        logger.info("Server is Shutting down gracefully");
      });
    process.exit(1);
  }
};
