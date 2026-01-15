import mongoose from "mongoose";
import { logger } from "../utils/winston.js";

export const connectDb = async (uri) => {
  try {
    await mongoose.connect(uri, {
      dbName: "streaming-platform",
      maxPoolSize: 10,
    });
  } catch (err) {
    logger.error("Error while connecting database", {
      message: err.message,
      stack: err.stack,
    });
    throw err;
  }
};

export const disconnectDb = async () => {
  try {
    await mongoose.disconnect();
    logger.info("Database is disconnected successfully");
  } catch (err) {
    logger.error("Error while Disconnecting database", {
      message: err.message,
      stack: err.stack,
    });
    throw err;
  }
};
