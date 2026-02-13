import s3 from "@/config/s3";
import {
  AppError,
  InternalServerError,
  NotFoundError,
  UploadFailedError,
  ValidationError,
} from "@/error";
import logger from "@/lib/winston";
import Video from "@/models/video.model";
import {
  CompleteMultipartUploadCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";

export const completeUploadService = async (
  videoId: string,
  userId: string,
  parts: { partNumber: number; etag: string }[],
) => {
  try {
    const video = await Video.findOne({
      _id: videoId,
      owner: userId,
    });

    if (!video) throw new NotFoundError("Requested Video not found");
    if (video.status === "FAILED")
      throw new UploadFailedError(
        "Upload previously failed. Please re-initiate upload.",
      );

    if (video.status !== "INITIATED") {
      return {
        id: video._id,
        status: video.status,
      };
    }
    await s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: process.env.S3_BUCKET,
        Key: video.s3Key,
        UploadId: video.s3UploadId,
        MultipartUpload: {
          Parts: parts.map((p) => ({
            PartNumber: p.partNumber,
            ETag: p.etag,
          })),
        },
      }),
    );

    video.status = "UPLOADED";
    await video.save();

    return {
      id: video._id,
      status: video.status,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;

    if (error instanceof S3ServiceException) {
      logger.error("S3 error in completeUploadService:", {
        videoId: videoId,
        userId: userId,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      if (error.name === "NoSuchUpload") {
        throw new NotFoundError(
          "No such upload found in S3. Please re-initiate upload.",
        );
      }
      if (error.name === "InvalidPart") {
        throw new ValidationError(
          "parts",
          "One or more parts are invalid. Please verify part numbers and ETags.",
        );
      }
      if (error.name === "EntityTooSmall") {
        throw new ValidationError(
          "parts",
          "One or more parts are too small. Each part must be at least 5 MB in size, except for the last part.",
        );
      }
      if (error.name === "EntityTooLarge") {
        throw new ValidationError(
          "parts",
          "One or more parts are too large. Each part must be less than 5 GB in size.",
        );
      }
      if (error.name === "InvalidUploadId") {
        throw new NotFoundError(
          "Invalid upload ID. Please re-initiate upload.",
        );
      }

      if (error.name === "AccessDenied") {
        throw new InternalServerError(
          "Access denied when completing upload. Please check S3 permissions.",
          error,
        );
      }

      throw new InternalServerError(
        "S3 error occurred while completing upload",
        error,
      );
    }

    logger.error("Error in completeUploadService:", {
      videoId: videoId,
      userId: userId,
      error: error instanceof Error ? error : new Error(String(error)),
    });
    throw new InternalServerError(
      "Could not complete upload",
      error instanceof Error ? error : new Error(String(error)),
    );
  }
};
