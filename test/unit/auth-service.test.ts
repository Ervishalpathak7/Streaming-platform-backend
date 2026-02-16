import { describe, it, expect, beforeEach, afterAll } from "@jest/globals";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "../../src/modules/auth/auth.service";
import { prisma } from "../../src/common/database/prisma";
import { findRefreshToken } from "../../src/modules/auth/refresh-token.repository";
import { verifyAccessToken } from "../../src/modules/auth/auth.utils";

describe("Auth Service", () => {
  const testEmail = "test@example.com";
  const testPassword = "password123";
  const testName = "Test User";

  beforeEach(async () => {
    // Clean up test data
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
    await prisma.$disconnect();
  });

  describe("registerUser", () => {
    it("should register a new user", async () => {
      const result = await registerUser({
        email: testEmail,
        password: testPassword,
        name: testName,
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);
      expect(result.user.name).toBe(testName);
      expect(result.user.role).toBe("USER");
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("should store refresh token in database", async () => {
      const result = await registerUser({
        email: testEmail,
        password: testPassword,
        name: testName,
      });

      const storedToken = await findRefreshToken(result.refreshToken);
      expect(storedToken).toBeTruthy();
      expect(storedToken?.userId).toBe(result.user.id);
      expect(storedToken?.revoked).toBe(false);
    });

    it("should generate valid access token", async () => {
      const result = await registerUser({
        email: testEmail,
        password: testPassword,
        name: testName,
      });

      const decoded = verifyAccessToken(result.accessToken) as any;
      expect(decoded.id).toBe(result.user.id);
      expect(decoded.email).toBe(testEmail);
      expect(decoded.role).toBe("USER");
    });

    it("should throw error for duplicate email", async () => {
      await registerUser({
        email: testEmail,
        password: testPassword,
        name: testName,
      });

      await expect(
        registerUser({
          email: testEmail,
          password: "different-password",
          name: "Different Name",
        }),
      ).rejects.toThrow("User already exists");
    });

    it("should hash password before storing", async () => {
      const result = await registerUser({
        email: testEmail,
        password: testPassword,
        name: testName,
      });

      const user = await prisma.user.findUnique({
        where: { id: result.user.id },
      });

      expect(user?.password).not.toBe(testPassword);
      expect(user?.password).toContain("$argon2"); // Argon2 hash prefix
    });
  });

  describe("loginUser", () => {
    beforeEach(async () => {
      // Register a user for login tests
      await registerUser({
        email: testEmail,
        password: testPassword,
        name: testName,
      });
    });

    it("should login with correct credentials", async () => {
      const result = await loginUser({
        email: testEmail,
        password: testPassword,
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("should store new refresh token on login", async () => {
      const result = await loginUser({
        email: testEmail,
        password: testPassword,
      });

      const storedToken = await findRefreshToken(result.refreshToken);
      expect(storedToken).toBeTruthy();
      expect(storedToken?.userId).toBe(result.user.id);
    });

    it("should throw error for invalid email", async () => {
      await expect(
        loginUser({
          email: "wrong@example.com",
          password: testPassword,
        }),
      ).rejects.toThrow("Invalid credentials");
    });

    it("should throw error for invalid password", async () => {
      await expect(
        loginUser({
          email: testEmail,
          password: "wrong-password",
        }),
      ).rejects.toThrow("Invalid credentials");
    });

    it("should create multiple refresh tokens for multiple logins", async () => {
      const login1 = await loginUser({
        email: testEmail,
        password: testPassword,
      });
      const login2 = await loginUser({
        email: testEmail,
        password: testPassword,
      });

      const token1 = await findRefreshToken(login1.refreshToken);
      const token2 = await findRefreshToken(login2.refreshToken);

      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1?.id).not.toBe(token2?.id);
    });
  });

  describe("refreshAccessToken", () => {
    let validRefreshToken: string;
    let userId: string;

    beforeEach(async () => {
      const result = await registerUser({
        email: testEmail,
        password: testPassword,
        name: testName,
      });
      validRefreshToken = result.refreshToken;
      userId = result.user.id;
    });

    it("should generate new access token with valid refresh token", async () => {
      const result = await refreshAccessToken(validRefreshToken);

      expect(result.accessToken).toBeDefined();

      const decoded = verifyAccessToken(result.accessToken) as any;
      expect(decoded.id).toBe(userId);
    });

    it("should throw error for invalid refresh token", async () => {
      await expect(refreshAccessToken("invalid-token")).rejects.toThrow(
        "Invalid refresh token",
      );
    });

    it("should throw error for revoked refresh token", async () => {
      await logoutUser(validRefreshToken);

      await expect(refreshAccessToken(validRefreshToken)).rejects.toThrow(
        "Refresh token revoked",
      );
    });

    it("should throw error for expired refresh token", async () => {
      // Create an expired token
      const expiredResult = await registerUser({
        email: "expired@example.com",
        password: testPassword,
        name: "Expired User",
      });

      // Manually update token to be expired
      await prisma.refreshToken.updateMany({
        where: { userId: expiredResult.user.id },
        data: { expiresAt: new Date(Date.now() - 1000) }, // Expired 1 second ago
      });

      await expect(
        refreshAccessToken(expiredResult.refreshToken),
      ).rejects.toThrow("Refresh token expired");
    });
  });

  describe("logoutUser", () => {
    let validRefreshToken: string;

    beforeEach(async () => {
      const result = await registerUser({
        email: testEmail,
        password: testPassword,
        name: testName,
      });
      validRefreshToken = result.refreshToken;
    });

    it("should revoke refresh token", async () => {
      await logoutUser(validRefreshToken);

      const storedToken = await findRefreshToken(validRefreshToken);
      expect(storedToken?.revoked).toBe(true);
    });

    it("should prevent using revoked token for refresh", async () => {
      await logoutUser(validRefreshToken);

      await expect(refreshAccessToken(validRefreshToken)).rejects.toThrow(
        "Refresh token revoked",
      );
    });

    it("should not throw error for non-existent token", async () => {
      await expect(logoutUser("non-existent-token")).resolves.not.toThrow();
    });
  });
});
