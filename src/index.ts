import "dotenv/config";
import "@/config/mongoDb.js";
import "@/config/s3.js";
import "@/config/redis.js";
import logger from "@/lib/winston.js";
import server from "@/config/server.js";
import { gracefullShutdown } from "@/utils/shutdown.js";

if (!process.env.PORT) {
  logger.error("PORT environment variable not set — fatal startup error", {
    category: "server",
    service: "app",
    code: "SERVER_STARTUP_FAILED",
    lifecycle: "process",
  });
  process.exit(1);
}

let serverInstance: ReturnType<typeof server.listen>;

try {
  serverInstance = server.listen(process.env.PORT, () =>
    logger.info(`Server running at http://localhost:${process.env.PORT}`),
  );
} catch (error) {
  logger.error("Server failed to start — fatal startup error", {
    category: "server",
    service: "app",
    code: "SERVER_STARTUP_FAILED",
    lifecycle: "process",
    error,
  });
  await gracefullShutdown();
  process.exit(1);
}

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

export default serverInstance;
