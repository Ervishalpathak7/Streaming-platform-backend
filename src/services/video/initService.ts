import { S3_CHUNK_SIZE } from "@/config/s3";
import type { inItUploadRequest } from "@/controller/v1/videoController";
import Video from "@/models/video.model";
import { createMultipartUpload } from "../s3";
import { AppError, InternalServerError } from "@/error";
import logger from "@/lib/winston";

export const videoInItService = async (
  videoMetaData: inItUploadRequest,
  idempotencyKey: string,
  userId: string,
) => {
  const existingVideo = await Video.findOne({
    owner: userId,
    idempotencyKey,
  });

  if (existingVideo) {
    return {
      id: existingVideo._id.toString(),
      status: existingVideo.status,
    };
  }

  const totalParts = Math.ceil(videoMetaData.filesize / S3_CHUNK_SIZE);
  const s3Key = `videos/${userId}/${Date.now()}_${videoMetaData.filename}`;
  try {
    const multipartUploadData = await createMultipartUpload(
      s3Key,
      videoMetaData.filetype,
    );
    if (!multipartUploadData.uploadId) {
      throw new InternalServerError("Failed to create multipart upload");
    }

    const newVideo = await Video.create({
      owner: userId,
      title: videoMetaData.title.trim(),
      description: videoMetaData.description || "",
      filename: videoMetaData.filename,
      status: "INITIATED",
      idempotencyKey,
      totalChunks: totalParts,
      s3Key,
      s3UploadId: multipartUploadData.uploadId,
      size: videoMetaData.filesize,
    });

    return {
      id: newVideo._id.toString(),
      status: newVideo.status,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error("Error in videoInItService:", {
      videoMetaData: {
        title: videoMetaData.title,
        filename: videoMetaData.filename,
        filesize: videoMetaData.filesize,
        filetype: videoMetaData.filetype,
      },
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new InternalServerError(
      "Error creating multipart upload",
      error instanceof Error ? error : new Error(String(error)),
    );
  }
};
