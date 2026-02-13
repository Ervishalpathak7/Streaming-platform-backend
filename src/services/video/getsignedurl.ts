import Video from "@/models/video.model.js";
import logger from "@/lib/winston.js";
import { getUploadPartUrls } from "@/services/s3.js";
import {
  InternalServerError,
  NotFoundError,
  UploadFailedError,
} from "@/error/errors.js";
import { AppError, normalizeError } from "@/error/index.js";

export const signedUrlService = async (videoId: string, userId: string) => {
  try {
    const video = await Video.findOne({ _id: videoId, owner: userId });
    if (!video) throw new NotFoundError("Video not found");

    if (video.status === "FAILED")
      throw new UploadFailedError(
        "Upload previously failed. Please re-initiate upload.",
      );

    if (video.status !== "INITIATED") {
      return { videoId: video._id, status: video.status };
    }

    const signedUrls = await getUploadPartUrls(
      video.s3Key,
      video.s3UploadId,
      video.totalChunks,
    );

    return { videoId: video._id, status: video.status, signedUrls };
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error("Error in signedUrlService:", {
      videoId: videoId,
      userId: userId,
      error: normalizeError(error),
    });
    throw new InternalServerError(
      "Error in Signed URL Service",
      normalizeError(error),
    );
  }
};
