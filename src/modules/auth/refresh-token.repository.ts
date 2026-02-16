import { prisma } from "@common/database/prisma";
import crypto from "crypto";

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function storeRefreshToken(
  userId: string,
  token: string,
  expiresIn: number,
) {
  const hashedToken = hashRefreshToken(token);
  const expiresAt = new Date(Date.now() + expiresIn);

  return prisma.refreshToken.create({
    data: {
      userId,
      token: hashedToken,
      expiresAt,
    },
  });
}

export async function findRefreshToken(token: string) {
  const hashedToken = hashRefreshToken(token);
  return prisma.refreshToken.findUnique({
    where: { token: hashedToken },
  });
}

export async function revokeRefreshToken(token: string) {
  const hashedToken = hashRefreshToken(token);
  return prisma.refreshToken.updateMany({
    where: { token: hashedToken },
    data: { revoked: true },
  });
}

export async function revokeAllUserTokens(userId: string) {
  return prisma.refreshToken.updateMany({
    where: { userId },
    data: { revoked: true },
  });
}

export async function cleanupExpiredTokens() {
  return prisma.refreshToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { revoked: true }],
    },
  });
}
