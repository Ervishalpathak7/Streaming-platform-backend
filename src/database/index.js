import mongoose from "mongoose";
import { logger } from "../utils/winston.js";

export const connectDb = async (uri) => {
  try {
    await mongoose.connect(uri, {
      dbName: "streaming-platform",
      maxPoolSize: 10,
    });
  } catch (error) {
    logger.error("Database connection failed", {
      category: "server",
      service: "db",
      lifecycle: "process",
      code: "DB_CONNECTION_FAILED",
      error,
    });

    throw error;
  }
};

export const disconnectDb = async () => {
  try {
    await mongoose.disconnect();
  } catch (error) {
    logger.error("Database disconnection failed", {
      category: "server",
      service: "db",
      lifecycle: "process",
      code: "DB_DISCONNECTION_FAILED",
      error,
    });
    throw error;
  }
};
