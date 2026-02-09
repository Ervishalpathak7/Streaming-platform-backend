import logger from "@/lib/winston.js";
import mongoose from "mongoose";

if (!process.env.MONGO_URI) {
  logger.error("MONGO_URI environment variable is not set", {
    category: "server",
    service: "db",
    lifecycle: "startup",
    code: "MONGO_URI_NOT_SET",
  });
  throw new Error("MONGO_URI environment variable is not set");
}

export const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      dbName: "streamKaro",
    });
    logger.info("Database connection established");
  } catch (error) {
    logger.error("Database connection failed", {
      category: "server",
      service: "db",
      lifecycle: "startup",
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
