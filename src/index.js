import app from "./app.js";
import { connectDb } from "./database/index.js";
import { gracefullShutdown } from "./utils/shutdown.js";
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "";
import { v2 } from "cloudinary";
import { logger } from "./utils/winston.js";
import { waitForRedis } from "./cache/index.js";

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
  } catch (err) {
    await gracefullShutdown();
    logger.error("Failed to start server", {
      message: err.message,
      stack: err.stack,
    });

    process.exit(1);
  }
};

startServer();

process.on("SIGTERM", gracefullShutdown);
process.on("SIGINT", gracefullShutdown);

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", err);
  gracefullShutdown();
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled rejection", err);
  gracefullShutdown();
});
