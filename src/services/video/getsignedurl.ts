import Video from "@/models/video.model";
import logger from "@/lib/winston";
import { getUploadPartUrls } from "@/services/s3";
import {
  AppError,
  InternalServerError,
  NotFoundError,
  UploadFailedError,
} from "@/error";

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
      error: error instanceof Error ? error.message : String(error),
    });
    throw new InternalServerError(
      "Error in Signed URL Service",
      error instanceof Error ? error : new Error(String(error)),
    );
  }
};
