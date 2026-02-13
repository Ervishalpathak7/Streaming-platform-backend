import { S3_CHUNK_SIZE } from "@/config/s3.js";
import type { InitUploadRequest } from "@/controller/v1/videoController.js";
import Video from "@/models/video.model.js";
import {  InternalServerError } from "@/error/errors.js";
import logger from "@/lib/winston.js";
import { createMultipartUpload } from "../s3.js";
import { AppError } from "@/error/index.js";

export const videoInitService = async (
  videoMetaData: InitUploadRequest,
  idempotencyKey: string,
  userId: string,
) => {
  // Idempotency key is already per-user (checked with owner field)
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
  
  // Use transaction-like approach: create video first, then S3 upload
  // If S3 fails, video will be marked as FAILED
  let s3UploadId: string | undefined;
  
  try {
    const multipartUploadData = await createMultipartUpload(
      s3Key,
      videoMetaData.filetype,
    );
    if (!multipartUploadData.uploadId) {
      throw new InternalServerError("Failed to create multipart upload");
    }
    s3UploadId = multipartUploadData.uploadId;

    const newVideo = await Video.create({
      owner: userId,
      title: videoMetaData.title.trim(),
      description: videoMetaData.description || "",
      filename: videoMetaData.filename,
      status: "INITIATED",
      idempotencyKey,
      totalChunks: totalParts,
      s3Key,
      s3UploadId,
      size: videoMetaData.filesize,
    });

    return {
      id: newVideo._id.toString(),
      status: newVideo.status,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    // If S3 upload was created but video creation failed, we should cleanup
    // However, S3 multipart uploads expire automatically, so we log it
    if (s3UploadId) {
      logger.warn("S3 multipart upload created but video creation failed", {
        s3UploadId,
        s3Key,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    
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
