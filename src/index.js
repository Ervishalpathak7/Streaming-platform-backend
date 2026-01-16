import app from "./app.js";
import { connectDb } from "./database/index.js";
import { gracefullShutdown } from "./utils/shutdown.js";
import { v2 } from "cloudinary";
import { logger } from "./utils/winston.js";
import { waitForRedis } from "./cache/index.js";
import { configDotenv } from "dotenv";
configDotenv();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || null;
const ENV = process.env.NODE_ENV || "DEV";
export let server;

v2.config({
  secure: true,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
});

const startServer = async () => {
  try {
    await connectDb(MONGO_URI);
    logger.info("MongoDB connected");

    await waitForRedis();
    logger.info("Redis Connected");

    server = app.listen(PORT, () => {
      logger.info(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    await gracefullShutdown();
    logger.error("Server failed to start — fatal startup error", {
      category: "server",
      service: "app",
      code: "SERVER_STARTUP_FAILED",
      lifecycle: "process",
      error,
    });
    process.exit(1);
  }
};

startServer();

process.on("SIGTERM", gracefullShutdown);
process.on("SIGINT", gracefullShutdown);

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception — process will exit", {
    category: "server",
    service: "app",
    code: "UNCAUGHT_EXCEPTION",
    lifecycle: "process",
    error,
  });
  gracefullShutdown();
});

process.on("unhandledRejection", (error) => {
  logger.error("Unhandle Rejection — process will exit", {
    category: "server",
    service: "app",
    code: "UNHANDLE_REJECTION",
    lifecycle: "process",
    error,
  });
  gracefullShutdown();
});
