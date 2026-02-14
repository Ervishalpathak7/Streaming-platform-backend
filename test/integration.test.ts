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
    expect(body).toHaveProperty("id");
    expect(body.email).toBe(email);
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
    const tokens = JSON.parse(loginRes.payload);
    expect(tokens).toHaveProperty("accessToken");
    expect(tokens).toHaveProperty("refreshToken");
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;

    // 3. Get Me
    const meRes = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(meRes.statusCode).toBe(200);
    expect(JSON.parse(meRes.payload)).toHaveProperty("email", email);

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
    });
    expect(logoutRes.statusCode).toBe(200);
  });
});
