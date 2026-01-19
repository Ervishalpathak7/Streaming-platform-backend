import { configDotenv } from "dotenv";
configDotenv();
import { connectRedis, waitForRedis } from "./cache/index.js";
import { connectDb } from "./database/index.js";
import { gracefullShutdown } from "./utils/shutdown.js";
import { logger } from "./utils/winston.js";
import { v2 } from "cloudinary";
import app from "./app.js";
import { rateLimitstart } from "./middlewares/rateLimiting.js";

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
const ENV = process.env.NODE_ENV || "DEV";
const REDIS_URL = process.env.REDIS_URL;
export let server;

v2.config({
  secure: true,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
});

const startServer = async () => {
  try {
    if (!PORT || !MONGO_URI || !ENV || !REDIS_URL) {
      logger.error("NO ENV SET — fatal startup error", {
        category: "server",
        service: "app",
        code: "SERVER_STARTUP_FAILED",
        lifecycle: "process",
      })
      process.exit(1)
    }

    connectRedis(REDIS_URL);
    await waitForRedis();

    rateLimitstart();

    await connectDb(MONGO_URI);
    logger.info("MongoDB connected");

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
