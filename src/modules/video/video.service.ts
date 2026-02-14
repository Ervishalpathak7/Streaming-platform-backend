import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../../common/config/config";
import {
  createVideo,
  updateVideoStatus,
  findVideoById,
  findVideosByUserId,
} from "./video.repository";
import { CreateVideoInput } from "./video.schema";
import { AppError } from "../../common/errors/error-handler";
import { StatusCodes } from "http-status-codes";
import { cacheService } from "../../common/cache/cache.service";

const s3Client = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
  endpoint: config.AWS_ENDPOINT,
  forcePathStyle: true, // Needed for MinIO/Local
});

export async function initiateUpload(userId: string, input: CreateVideoInput) {
  // 1. Create DB Record
  const video = await createVideo({ ...input, userId });

  // 2. Generate Presigned URL
  const key = `videos/${video.id}/${input.title.replace(/\s+/g, "_")}`;
  const command = new PutObjectCommand({
    Bucket: config.AWS_BUCKET_NAME,
    Key: key,
    ContentType: input.fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return { videoId: video.id, uploadUrl };
}

export async function confirmUpload(videoId: string, userId: string) {
  const video = await findVideoById(videoId);

  if (!video) {
    throw new AppError("Video not found", StatusCodes.NOT_FOUND);
  }

  if (video.userId !== userId) {
    throw new AppError("Unauthorized", StatusCodes.FORBIDDEN);
  }

  // In a real app, we would verify S3 object existence here via HeadObject

  const updated = await updateVideoStatus(videoId, "UPLOADED");

  // Invalidate list cache for this user
  await cacheService.deleteMatch(`videos:list:${userId}:*`);

  return updated;
}

export async function listVideos(
  userId: string,
  limit: number,
  cursor?: string,
) {
  const cacheKey = `videos:list:${userId}:${limit}:${cursor || "start"}`;
  const cached = await cacheService.get<{
    items: Awaited<ReturnType<typeof findVideosByUserId>>;
    nextCursor: string | null;
  }>(cacheKey);
  if (cached) {
    return cached;
  }

  const videos = await findVideosByUserId(userId, limit, cursor);
  let nextCursor: string | null = null;

  if (videos.length > limit) {
    const nextItem = videos.pop(); // Remove the extra item
    nextCursor = nextItem!.id;
  }

  const result = { items: videos, nextCursor };
  await cacheService.set(cacheKey, result, 60); // Cache for 60 seconds
  return result;
}
