import { PrismaClient } from "@prisma/client";
import { config } from "../config/config";
import { logger } from "../logger/logger";

export const prisma = new PrismaClient({
  log:
    config.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  datasources: {
    db: {
      url: config.DATABASE_URL,
    },
  },
});

export async function connectDB() {
  try {
    await prisma.$connect();
    logger.info("✅ Database connected successfully");
  } catch (error) {
    logger.error(error, "❌ Database connection failed");
    process.exit(1);
  }
}

export async function disconnectDB() {
  await prisma.$disconnect();
  logger.info("🛑 Database disconnected");
}
