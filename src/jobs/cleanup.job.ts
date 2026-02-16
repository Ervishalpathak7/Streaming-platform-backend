import { cleanupExpiredTokens } from "@modules/auth/refresh-token.repository";
import { prisma } from "@common/database/prisma";
import { logger } from "@common/logger/logger";

export async function runCleanupJob() {
  logger.info("Starting cleanup job...");

  try {
    // Clean expired refresh tokens
    const deletedTokens = await cleanupExpiredTokens();
    logger.info(
      { count: deletedTokens.count },
      "Cleaned up expired refresh tokens",
    );

    // Clean old idempotency keys (older than 24 hours)
    const deletedKeys = await prisma.idempotencyKey.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });
    logger.info(
      { count: deletedKeys.count },
      "Cleaned up old idempotency keys",
    );

    // Clean failed videos (older than 7 days)
    const deletedVideos = await prisma.video.deleteMany({
      where: {
        status: "FAILED",
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });
    logger.info({ count: deletedVideos.count }, "Cleaned up failed videos");
  } catch (error) {
    logger.error(error, "Cleanup job failed");
  }
}
