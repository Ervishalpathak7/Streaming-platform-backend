import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../../common/config/config";
import {
  createVideo,
  updateVideoStatus,
  findVideoById,
  findVideosByUserId,
  updateVideoUploadId,
} from "./video.repository";
import { CreateVideoInput, CompleteUploadInput } from "./video.schema";
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

// Calculate number of parts (5MB per part minimum for S3)
const PART_SIZE = 5 * 1024 * 1024; // 5MB

export async function initiateUpload(userId: string, input: CreateVideoInput) {
  // 1. Create DB Record with INITIATED status
  const video = await createVideo({
    ...input,
    userId,
  });

  return {
    status: "success" as const,
    videoId: video.id,
  };
}

export async function getSignedUrls(videoId: string, userId: string) {
  const video = await findVideoById(videoId);

  if (!video) {
    throw new AppError("Video not found", StatusCodes.NOT_FOUND);
  }

  if (video.userId !== userId) {
    throw new AppError("Unauthorized", StatusCodes.FORBIDDEN);
  }

  if (video.status !== "INITIATED") {
    throw new AppError(
      "Invalid video state. Must be INITIATED",
      StatusCodes.CONFLICT,
    );
  }

  // 2. Initiate S3 multipart upload
  const key = `videos/${video.id}/${video.filename}`;
  const command = new CreateMultipartUploadCommand({
    Bucket: config.AWS_BUCKET_NAME,
    Key: key,
    ContentType: video.filetype || "video/mp4",
  });

  const multipartUpload = await s3Client.send(command);
  const uploadId = multipartUpload.UploadId!;

  // 3. Save uploadId to database
  await updateVideoUploadId(videoId, uploadId);

  // 4. Calculate number of parts
  const numParts = Math.ceil((video.filesize || 0) / PART_SIZE);

  // 5. Generate presigned URLs for each part
  const signedUrls = await Promise.all(
    Array.from({ length: numParts }, async (_, i) => {
      const partNumber = i + 1;
      const uploadPartCommand = new UploadPartCommand({
        Bucket: config.AWS_BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });

      const url = await getSignedUrl(s3Client, uploadPartCommand, {
        expiresIn: 3600, // 1 hour
      });

      return { partNumber, url };
    }),
  );

  // 6. Update status to UPLOADING
  await updateVideoStatus(videoId, "UPLOADING");
  return {
    status: "success" as const,
    data: { signedUrls },
  };
}

export async function completeMultipartUpload(
  videoId: string,
  userId: string,
  input: CompleteUploadInput,
) {
  const video = await findVideoById(videoId);

  if (!video) {
    throw new AppError("Video not found", StatusCodes.NOT_FOUND);
  }

  if (video.userId !== userId) {
    throw new AppError("Unauthorized", StatusCodes.FORBIDDEN);
  }

  if (video.status !== "UPLOADING") {
    throw new AppError(
      "Invalid video state. Must be UPLOADING",
      StatusCodes.CONFLICT,
    );
  }

  if (!video.uploadId) {
    throw new AppError("Upload ID not found", StatusCodes.BAD_REQUEST);
  }

  // Complete S3 multipart upload
  const key = `videos/${video.id}/${video.filename}`;
  const command = new CompleteMultipartUploadCommand({
    Bucket: config.AWS_BUCKET_NAME,
    Key: key,
    UploadId: video.uploadId,
    MultipartUpload: {
      Parts: input.parts.map((p) => ({
        PartNumber: p.partNumber,
        ETag: p.eTag,
      })),
    },
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    await updateVideoStatus(videoId, "FAILED");
    throw new AppError(
      "Failed to complete multipart upload",
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }

  await updateVideoStatus(videoId, "PROCESSING");
  // Invalidate list cache for this user
  await cacheService.deleteMatch(`videos:list:${userId}:*`);
  return {
    status: "success" as const,
    message: "Upload completed successfully. Video is being processed.",
  };
}

export async function getVideoById(videoId: string, userId: string) {
  const video = await findVideoById(videoId);

  if (!video) {
    throw new AppError("Video not found", StatusCodes.NOT_FOUND);
  }

  if (video.userId !== userId) {
    throw new AppError("Unauthorized", StatusCodes.FORBIDDEN);
  }

  return {
    id: video.id,
    title: video.title,
    description: video.description,
    status: video.status,
    playbackUrl: video.playbackUrl || null,
    thumbnailUrl: null, // TODO: Add thumbnail generation
    createdAt: video.createdAt,
  };
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
    const nextItem = videos.pop();
    nextCursor = nextItem!.id;
  }

  const items = videos.map((v) => ({
    id: v.id,
    title: v.title,
    description: v.description,
    status: v.status,
    playbackUrl: v.playbackUrl || null,
    thumbnailUrl: null,
    createdAt: v.createdAt,
  }));

  const result = { items, nextCursor };
  await cacheService.set(cacheKey, result, 600); // Cache for 10mins
  return result;
}

export function isValidUUID(uuid: string) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
