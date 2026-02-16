import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { buildApp } from "../../src/app";
import { FastifyInstance } from "fastify";
import { prisma } from "../../src/common/database/prisma";

describe("Video Upload Integration Tests", () => {
  let app: FastifyInstance;
  let accessToken: string;
  let userId: string;
  const testEmail = "video-test@example.com";
  const testPassword = "password123";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Clean up test data
    await prisma.video.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });

    // Register and login test user
    const registerResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: testEmail,
        password: testPassword,
        name: "Video Test User",
      },
    });

    const body = JSON.parse(registerResponse.body);
    accessToken = body.data.accessToken;
    userId = body.data.user.id;
  });

  afterAll(async () => {
    await prisma.video.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
    await app.close();
  });

  describe("POST /api/v1/videos/init", () => {
    it("should initiate video upload", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/videos/init",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "idempotency-key": `test-init-${Date.now()}`,
        },
        payload: {
          title: "Test Video",
          description: "Test Description",
          filename: "test-video.mp4",
          filesize: 10485760, // 10MB
          filetype: "video/mp4",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data.videoId).toBeDefined();
      expect(body.data.uploadId).toBeDefined();
    });

    it("should require authentication", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/videos/init",
        headers: {
          "idempotency-key": `test-init-noauth-${Date.now()}`,
        },
        payload: {
          title: "Test Video",
          description: "Test Description",
          filename: "test.mp4",
          filesize: 10485760,
          filetype: "video/mp4",
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it("should validate file size (max 1GB)", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/videos/init",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "idempotency-key": `test-init-large-${Date.now()}`,
        },
        payload: {
          title: "Large Video",
          description: "Too large",
          filename: "large.mp4",
          filesize: 2 * 1024 * 1024 * 1024, // 2GB
          filetype: "video/mp4",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should validate file type", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/videos/init",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "idempotency-key": `test-init-type-${Date.now()}`,
        },
        payload: {
          title: "Invalid Type",
          description: "Wrong type",
          filename: "file.txt",
          filesize: 1024,
          filetype: "text/plain",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should enforce idempotency", async () => {
      const idempotencyKey = `test-idempotent-${Date.now()}`;

      const response1 = await app.inject({
        method: "POST",
        url: "/api/v1/videos/init",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "idempotency-key": idempotencyKey,
        },
        payload: {
          title: "Idempotent Video",
          description: "Test",
          filename: "idempotent.mp4",
          filesize: 10485760,
          filetype: "video/mp4",
        },
      });

      const response2 = await app.inject({
        method: "POST",
        url: "/api/v1/videos/init",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "idempotency-key": idempotencyKey,
        },
        payload: {
          title: "Different Title",
          description: "Different",
          filename: "different.mp4",
          filesize: 20971520,
          filetype: "video/mp4",
        },
      });

      expect(response1.statusCode).toBe(200);
      expect(response2.statusCode).toBe(200);

      const body1 = JSON.parse(response1.body);
      const body2 = JSON.parse(response2.body);

      // Should return same video ID
      expect(body1.data.videoId).toBe(body2.data.videoId);
    });
  });

  describe("GET /api/v1/videos/signedurl/:videoId", () => {
    let videoId: string;

    beforeAll(async () => {
      const initResponse = await app.inject({
        method: "POST",
        url: "/api/v1/videos/init",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "idempotency-key": `test-signedurl-${Date.now()}`,
        },
        payload: {
          title: "Signed URL Test",
          description: "Test",
          filename: "signedurl.mp4",
          filesize: 10485760, // 10MB
          filetype: "video/mp4",
        },
      });

      const body = JSON.parse(initResponse.body);
      videoId = body.data.videoId;
    });

    it("should generate signed URLs for multipart upload", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/api/v1/videos/signedurl/${videoId}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data.signedUrls).toBeDefined();
      expect(Array.isArray(body.data.signedUrls)).toBe(true);
      expect(body.data.signedUrls.length).toBeGreaterThan(0);

      // Each signed URL should have partNumber and url
      body.data.signedUrls.forEach((item: any) => {
        expect(item.partNumber).toBeDefined();
        expect(item.url).toBeDefined();
        expect(item.url).toContain("https://");
      });
    });

    it("should return 404 for non-existent video", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/videos/signedurl/00000000-0000-0000-0000-000000000000",
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it("should return 403 for unauthorized access", async () => {
      // Create another user
      const otherUserResponse = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: "other-video-user@example.com",
          password: testPassword,
          name: "Other User",
        },
      });

      const otherBody = JSON.parse(otherUserResponse.body);
      const otherToken = otherBody.data.accessToken;

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/videos/signedurl/${videoId}`,
        headers: {
          authorization: `Bearer ${otherToken}`,
        },
      });

      expect(response.statusCode).toBe(403);

      // Cleanup
      await prisma.user.delete({
        where: { email: "other-video-user@example.com" },
      });
    });
  });

  describe("GET /api/v1/videos/mine", () => {
    beforeAll(async () => {
      // Create multiple videos
      for (let i = 0; i < 3; i++) {
        await app.inject({
          method: "POST",
          url: "/api/v1/videos/init",
          headers: {
            authorization: `Bearer ${accessToken}`,
            "idempotency-key": `test-mine-${i}-${Date.now()}`,
          },
          payload: {
            title: `My Video ${i}`,
            description: `Description ${i}`,
            filename: `video${i}.mp4`,
            filesize: 10485760,
            filetype: "video/mp4",
          },
        });
      }
    });

    it("should list user's videos", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/videos/mine",
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data.videos).toBeDefined();
      expect(Array.isArray(body.data.videos)).toBe(true);
      expect(body.data.videos.length).toBeGreaterThanOrEqual(3);
    });

    it("should support pagination", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/videos/mine?limit=2",
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.videos.length).toBeLessThanOrEqual(2);

      if (body.data.nextCursor) {
        expect(typeof body.data.nextCursor).toBe("string");
      }
    });

    it("should require authentication", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/videos/mine",
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /api/v1/videos/:videoId", () => {
    let videoId: string;

    beforeAll(async () => {
      const initResponse = await app.inject({
        method: "POST",
        url: "/api/v1/videos/init",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "idempotency-key": `test-get-${Date.now()}`,
        },
        payload: {
          title: "Get Video Test",
          description: "Test",
          filename: "get.mp4",
          filesize: 10485760,
          filetype: "video/mp4",
        },
      });

      const body = JSON.parse(initResponse.body);
      videoId = body.data.videoId;
    });

    it("should get video by ID", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/api/v1/videos/${videoId}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data.id).toBe(videoId);
      expect(body.data.title).toBe("Get Video Test");
    });

    it("should return 404 for non-existent video", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/videos/00000000-0000-0000-0000-000000000000",
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
