import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { buildApp } from "../../src/app";
import { FastifyInstance } from "fastify";
import { prisma } from "../../src/common/database/prisma";

describe("Auth Integration Tests", () => {
  let app: FastifyInstance;
  const testEmail = "integration@example.com";
  const testPassword = "password123";
  const testName = "Integration Test User";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

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
    await app.close();
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: testEmail,
          password: testPassword,
          name: testName,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data.user.email).toBe(testEmail);
      expect(body.data.user.name).toBe(testName);
      expect(body.data.accessToken).toBeDefined();

      // Check refresh token cookie
      const cookies = response.cookies;
      const refreshTokenCookie = cookies.find((c) => c.name === "refreshToken");
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie?.httpOnly).toBe(true);
    });

    it("should return 409 for duplicate email", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: testEmail,
          password: testPassword,
          name: testName,
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.message).toContain("already exists");
    });

    it("should validate email format", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: "invalid-email",
          password: testPassword,
          name: testName,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should validate password length", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: "new@example.com",
          password: "short",
          name: testName,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should login with correct credentials", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: testEmail,
          password: testPassword,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data.user.email).toBe(testEmail);
      expect(body.data.accessToken).toBeDefined();

      const cookies = response.cookies;
      const refreshTokenCookie = cookies.find((c) => c.name === "refreshToken");
      expect(refreshTokenCookie).toBeDefined();
    });

    it("should return 401 for invalid email", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: "wrong@example.com",
          password: testPassword,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it("should return 401 for invalid password", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: testEmail,
          password: "wrong-password",
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    let refreshToken: string;

    beforeAll(async () => {
      const loginResponse = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: testEmail,
          password: testPassword,
        },
      });

      const cookies = loginResponse.cookies;
      const refreshTokenCookie = cookies.find((c) => c.name === "refreshToken");
      refreshToken = refreshTokenCookie?.value || "";
    });

    it("should refresh access token with valid refresh token", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        cookies: { refreshToken },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data.accessToken).toBeDefined();
    });

    it("should return 401 for missing refresh token", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
      });

      expect(response.statusCode).toBe(401);
    });

    it("should return 401 for invalid refresh token", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        cookies: { refreshToken: "invalid-token" },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    let refreshToken: string;
    let accessToken: string;

    beforeEach(async () => {
      const loginResponse = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: testEmail,
          password: testPassword,
        },
      });

      const body = JSON.parse(loginResponse.body);
      accessToken = body.data.accessToken;

      const cookies = loginResponse.cookies;
      const refreshTokenCookie = cookies.find((c) => c.name === "refreshToken");
      refreshToken = refreshTokenCookie?.value || "";
    });

    it("should logout and revoke refresh token", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/logout",
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        cookies: { refreshToken },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");

      // Try to use revoked token
      const refreshResponse = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        cookies: { refreshToken },
      });

      expect(refreshResponse.statusCode).toBe(401);
    });

    it("should require authentication", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/logout",
        cookies: { refreshToken },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    let accessToken: string;

    beforeAll(async () => {
      const loginResponse = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: testEmail,
          password: testPassword,
        },
      });

      const body = JSON.parse(loginResponse.body);
      accessToken = body.data.accessToken;
    });

    it("should return current user profile", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data.email).toBe(testEmail);
      expect(body.data.name).toBe(testName);
    });

    it("should return 401 without token", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
      });

      expect(response.statusCode).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: {
          authorization: "Bearer invalid-token",
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("Complete Auth Flow", () => {
    it("should complete full authentication flow", async () => {
      const uniqueEmail = `flow-${Date.now()}@example.com`;

      // 1. Register
      const registerResponse = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: uniqueEmail,
          password: testPassword,
          name: "Flow Test",
        },
      });
      expect(registerResponse.statusCode).toBe(201);
      const registerBody = JSON.parse(registerResponse.body);
      const accessToken1 = registerBody.data.accessToken;

      // 2. Get profile with access token
      const meResponse1 = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: { authorization: `Bearer ${accessToken1}` },
      });
      expect(meResponse1.statusCode).toBe(200);

      // 3. Refresh token
      const cookies1 = registerResponse.cookies;
      const refreshTokenCookie1 = cookies1.find(
        (c) => c.name === "refreshToken",
      );
      const refreshResponse = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        cookies: { refreshToken: refreshTokenCookie1?.value || "" },
      });
      expect(refreshResponse.statusCode).toBe(200);
      const refreshBody = JSON.parse(refreshResponse.body);
      const accessToken2 = refreshBody.data.accessToken;

      // 4. Use new access token
      const meResponse2 = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: { authorization: `Bearer ${accessToken2}` },
      });
      expect(meResponse2.statusCode).toBe(200);

      // 5. Logout
      const logoutResponse = await app.inject({
        method: "POST",
        url: "/api/v1/auth/logout",
        headers: { authorization: `Bearer ${accessToken2}` },
        cookies: { refreshToken: refreshTokenCookie1?.value || "" },
      });
      expect(logoutResponse.statusCode).toBe(200);

      // 6. Verify token is revoked
      const refreshResponse2 = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        cookies: { refreshToken: refreshTokenCookie1?.value || "" },
      });
      expect(refreshResponse2.statusCode).toBe(401);

      // Cleanup
      await prisma.user.delete({ where: { email: uniqueEmail } });
    });
  });
});
