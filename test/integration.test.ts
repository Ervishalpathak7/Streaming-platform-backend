import { buildApp } from "../src/app";
import { FastifyInstance } from "fastify";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals"; // Using Jest globals requires setup, assuming standard jest
import supertest from "supertest";
import { prisma } from "../src/common/database/prisma";

// Use a separate test DB or mock? For now, using main DB but with cleanup
// Ideally we use a test container, but for this step verifying the app boots is key

describe("Integration Tests", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it("GET /health should return 200", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toHaveProperty("status", "ok");
  });

  it("POST /api/v1/auth/register should create user", async () => {
    const email = `test-${Date.now()}@example.com`;
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email,
        password: "password123",
        name: "Test User",
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe("success");
    expect(body.message).toBe("User registered successfully");
    expect(response.headers.authorization).toBeDefined();
  });

  let accessToken = "";
  let refreshToken = "";
  const email = "auth-flow@example.com";
  const password = "password123";

  it("should complete full auth flow", async () => {
    // 1. Register
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email, password, name: "Auth User" },
    });

    // 2. Login
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password },
    });
    expect(loginRes.statusCode).toBe(200);
    const body = JSON.parse(loginRes.payload);
    expect(body.status).toBe("success");
    expect(body.message).toBe("Login successful");

    // Extract tokens from headers
    const authHeader = loginRes.headers.authorization as string;
    expect(authHeader).toBeDefined();
    accessToken = authHeader.replace("Bearer ", "");

    const setCookieHeader = loginRes.headers["set-cookie"] as string;
    expect(setCookieHeader).toBeDefined();
    refreshToken = setCookieHeader.split(";")[0].split("=")[1];

    // 3. Get Me
    const meRes = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(meRes.statusCode).toBe(200);
    const user = JSON.parse(meRes.payload);
    expect(user.email).toBe(email);

    // 4. Refresh Token
    const refreshRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      payload: { refreshToken },
    });
    expect(refreshRes.statusCode).toBe(200);
    expect(JSON.parse(refreshRes.payload)).toHaveProperty("accessToken");

    // 5. Logout
    const logoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(logoutRes.statusCode).toBe(200);
  });
});
