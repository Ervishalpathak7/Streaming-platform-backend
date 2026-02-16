import { describe, it, expect, beforeEach, afterAll } from "@jest/globals";
import {
  storeRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanupExpiredTokens,
  hashRefreshToken,
} from "../../src/modules/auth/refresh-token.repository";
import { prisma } from "../../src/common/database/prisma";

describe("Refresh Token Repository", () => {
  const userId = "test-user-id-123";
  const token = "test-refresh-token-abc";
  const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days

  beforeEach(async () => {
    // Clean up test data
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  });

  afterAll(async () => {
    // Clean up and disconnect
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
    await prisma.$disconnect();
  });

  describe("hashRefreshToken", () => {
    it("should hash token consistently", () => {
      const hash1 = hashRefreshToken(token);
      const hash2 = hashRefreshToken(token);
      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different tokens", () => {
      const hash1 = hashRefreshToken("token1");
      const hash2 = hashRefreshToken("token2");
      expect(hash1).not.toBe(hash2);
    });

    it("should produce 64-character hex string (SHA-256)", () => {
      const hash = hashRefreshToken(token);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("storeRefreshToken", () => {
    it("should store refresh token in database", async () => {
      const stored = await storeRefreshToken(userId, token, expiresIn);

      expect(stored.userId).toBe(userId);
      expect(stored.token).toBe(hashRefreshToken(token));
      expect(stored.revoked).toBe(false);
      expect(stored.expiresAt).toBeInstanceOf(Date);
    });

    it("should set correct expiration time", async () => {
      const before = Date.now();
      const stored = await storeRefreshToken(userId, token, expiresIn);
      const after = Date.now();

      const expectedExpiry = before + expiresIn;
      const actualExpiry = stored.expiresAt.getTime();

      // Allow 1 second tolerance
      expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(actualExpiry).toBeLessThanOrEqual(after + expiresIn + 1000);
    });

    it("should hash token before storing", async () => {
      const stored = await storeRefreshToken(userId, token, expiresIn);
      expect(stored.token).not.toBe(token);
      expect(stored.token).toBe(hashRefreshToken(token));
    });
  });

  describe("findRefreshToken", () => {
    it("should find stored token", async () => {
      await storeRefreshToken(userId, token, expiresIn);
      const found = await findRefreshToken(token);

      expect(found).toBeTruthy();
      expect(found?.userId).toBe(userId);
      expect(found?.revoked).toBe(false);
    });

    it("should return null for non-existent token", async () => {
      const found = await findRefreshToken("non-existent-token");
      expect(found).toBeNull();
    });

    it("should find token by plaintext (not hash)", async () => {
      await storeRefreshToken(userId, token, expiresIn);

      // Should work with plaintext token
      const found = await findRefreshToken(token);
      expect(found).toBeTruthy();
    });
  });

  describe("revokeRefreshToken", () => {
    it("should revoke refresh token", async () => {
      await storeRefreshToken(userId, token, expiresIn);
      await revokeRefreshToken(token);

      const found = await findRefreshToken(token);
      expect(found?.revoked).toBe(true);
    });

    it("should not throw error for non-existent token", async () => {
      await expect(
        revokeRefreshToken("non-existent-token"),
      ).resolves.not.toThrow();
    });

    it("should only revoke specified token", async () => {
      const token1 = "token1";
      const token2 = "token2";

      await storeRefreshToken(userId, token1, expiresIn);
      await storeRefreshToken(userId, token2, expiresIn);

      await revokeRefreshToken(token1);

      const found1 = await findRefreshToken(token1);
      const found2 = await findRefreshToken(token2);

      expect(found1?.revoked).toBe(true);
      expect(found2?.revoked).toBe(false);
    });
  });

  describe("revokeAllUserTokens", () => {
    it("should revoke all tokens for a user", async () => {
      const token1 = "token1";
      const token2 = "token2";
      const token3 = "token3";

      await storeRefreshToken(userId, token1, expiresIn);
      await storeRefreshToken(userId, token2, expiresIn);
      await storeRefreshToken(userId, token3, expiresIn);

      await revokeAllUserTokens(userId);

      const found1 = await findRefreshToken(token1);
      const found2 = await findRefreshToken(token2);
      const found3 = await findRefreshToken(token3);

      expect(found1?.revoked).toBe(true);
      expect(found2?.revoked).toBe(true);
      expect(found3?.revoked).toBe(true);
    });

    it("should not affect other users' tokens", async () => {
      const userId2 = "other-user-id";
      const token1 = "token1";
      const token2 = "token2";

      await storeRefreshToken(userId, token1, expiresIn);
      await storeRefreshToken(userId2, token2, expiresIn);

      await revokeAllUserTokens(userId);

      const found1 = await findRefreshToken(token1);
      const found2 = await findRefreshToken(token2);

      expect(found1?.revoked).toBe(true);
      expect(found2?.revoked).toBe(false);
    });
  });

  describe("cleanupExpiredTokens", () => {
    it("should delete expired tokens", async () => {
      const expiredToken = "expired-token";
      const validToken = "valid-token";

      // Store expired token (already expired)
      await storeRefreshToken(userId, expiredToken, -1000); // Expired 1 second ago

      // Store valid token
      await storeRefreshToken(userId, validToken, expiresIn);

      await cleanupExpiredTokens();

      const foundExpired = await findRefreshToken(expiredToken);
      const foundValid = await findRefreshToken(validToken);

      expect(foundExpired).toBeNull();
      expect(foundValid).toBeTruthy();
    });

    it("should delete revoked tokens", async () => {
      const revokedToken = "revoked-token";
      const validToken = "valid-token";

      await storeRefreshToken(userId, revokedToken, expiresIn);
      await storeRefreshToken(userId, validToken, expiresIn);

      await revokeRefreshToken(revokedToken);
      await cleanupExpiredTokens();

      const foundRevoked = await findRefreshToken(revokedToken);
      const foundValid = await findRefreshToken(validToken);

      expect(foundRevoked).toBeNull();
      expect(foundValid).toBeTruthy();
    });

    it("should return count of deleted tokens", async () => {
      await storeRefreshToken(userId, "token1", -1000);
      await storeRefreshToken(userId, "token2", -1000);
      await storeRefreshToken(userId, "token3", expiresIn);

      const result = await cleanupExpiredTokens();
      expect(result.count).toBe(2);
    });
  });
});
