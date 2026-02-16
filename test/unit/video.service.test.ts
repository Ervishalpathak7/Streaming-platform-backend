import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  initiateUpload,
  getSignedUrls,
  completeMultipartUpload,
  listVideos,
} from "../../src/modules/video/video.service";
import * as videoRepository from "../../src/modules/video/video.repository";
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { cacheService } from "../../src/common/cache/cache.service";

// Mock Dependencies
jest.mock("../../src/modules/video/video.repository");
jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));
jest.mock("../../src/common/cache/cache.service");

// Create Mocked Handle
const videoRepositoryMock = videoRepository as jest.Mocked<
  typeof videoRepository
>;
const getSignedUrlMock = getSignedUrl as jest.MockedFunction<
  typeof getSignedUrl
>;
const cacheServiceMock = cacheService as jest.Mocked<typeof cacheService>;

describe("VideoService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSignedUrlMock.mockResolvedValue("https://s3.mocked.url/upload");
  });

  describe("initiateUpload", () => {
    it("should create video and return videoId", async () => {
      // Arrange
      const userId = "user-123";
      const input = {
        title: "My Video",
        description: "Test description",
        filename: "video.mp4",
        filesize: 10485760, // 10MB
        filetype: "video/mp4" as const,
      };

      const mockVideo = {
        id: "video-123",
        title: "My Video",
        description: "Test description",
        filename: "video.mp4",
        filesize: 10485760,
        filetype: "video/mp4",
        status: "INITIATED" as const,
        userId,
        url: null,
        uploadId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      videoRepositoryMock.createVideo.mockResolvedValue(mockVideo);

      // Act
      const result = await initiateUpload(userId, input);

      // Assert
      expect(videoRepositoryMock.createVideo).toHaveBeenCalledWith({
        ...input,
        userId,
      });
      expect(result).toEqual({
        status: "success",
        videoId: "video-123",
      });
    });
  });

  describe("listVideos", () => {
    it("should return cached results if available", async () => {
      const userId = "user-123";
      const cachedResult = {
        items: [
          {
            id: "v1",
            title: "Cached Video",
            description: null,
            status: "READY" as const,
            playbackUrl: "http://vid1",
            thumbnailUrl: null,
            createdAt: new Date(),
          },
        ],
        nextCursor: null,
      };

      cacheServiceMock.get.mockResolvedValue(cachedResult);

      const result = await listVideos(userId, 10);

      expect(result).toEqual(cachedResult);
      expect(cacheServiceMock.get).toHaveBeenCalled();
      expect(videoRepositoryMock.findVideosByUserId).not.toHaveBeenCalled();
    });

    it("should return paginated results and cache them", async () => {
      // Arrange
      const userId = "user-123";
      cacheServiceMock.get.mockResolvedValue(null);
      const mockVideos = [
        {
          id: "v1",
          title: "Vid 1",
          description: null,
          status: "READY" as const,
          userId,
          url: "http://vid1",
          filename: "video1.mp4",
          filesize: 1000,
          filetype: "video/mp4",
          uploadId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "v2",
          title: "Vid 2",
          description: null,
          status: "READY" as const,
          userId,
          url: "http://vid2",
          filename: "video2.mp4",
          filesize: 2000,
          filetype: "video/mp4",
          uploadId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      videoRepositoryMock.findVideosByUserId.mockResolvedValue(mockVideos);

      // Act
      const result = await listVideos(userId, 10);

      // Assert
      expect(videoRepositoryMock.findVideosByUserId).toHaveBeenCalledWith(
        userId,
        10,
        undefined,
      );
      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeNull();
      expect(cacheServiceMock.set).toHaveBeenCalled();
    });

    it("should return nextCursor when more items exist", async () => {
      // Arrange
      const userId = "user-123";
      const limit = 2;
      cacheServiceMock.get.mockResolvedValue(null);
      const mockVideos = [
        {
          id: "v1",
          title: "Vid 1",
          description: null,
          status: "READY" as const,
          userId,
          url: "http://vid1",
          filename: "video1.mp4",
          filesize: 1000,
          filetype: "video/mp4",
          uploadId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "v2",
          title: "Vid 2",
          description: null,
          status: "READY" as const,
          userId,
          url: "http://vid2",
          filename: "video2.mp4",
          filesize: 2000,
          filetype: "video/mp4",
          uploadId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "v3",
          title: "Vid 3 (Extra)",
          description: null,
          status: "READY" as const,
          userId,
          url: "http://vid3",
          filename: "video3.mp4",
          filesize: 3000,
          filetype: "video/mp4",
          uploadId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      videoRepositoryMock.findVideosByUserId.mockResolvedValue(mockVideos);

      // Act
      const result = await listVideos(userId, limit);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe("v3");
    });
  });
});
