import { v4 as uuidv4 } from "uuid";
import {
  IdempotencyError,
  UploadFailedError,
  InternalServerError,
  ValidationError,
  NotFoundError,
} from "@/error/index.js";
import { createMultipartUpload } from "../services/s3.js";
import { getUploadPartUrls } from "../services/s3.js";
import mongoose from "mongoose";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import type { Request, Response } from "express";
import { videoUploadInitSchema } from "@/Schemas/video.schema.js";
import s3, { S3_CHUNK_SIZE } from "@/config/s3.js";
import Video from "@/models/video.model.js";
import logger from "@/lib/winston.js";

export const initUploadControllerV2 = async (req: Request, res: Response) => {
  const { title, description, fileName, fileSize, contentType } =
    videoUploadInitSchema.parse(req.body);

  const idempotencyKey = req.headers["idempotency-key"] as string;
  if (!idempotencyKey)
    throw new IdempotencyError("Idempotency key is required");

  try {
    const totalParts = Math.ceil(fileSize / S3_CHUNK_SIZE);
    const existingVideo = await Video.findOne({
      owner: req.userId,
      idempotencyKey,
    });

    if (existingVideo) {
      if (
        existingVideo.status === "UPLOADED" ||
        existingVideo.status === "PROCESSING"
      ) {
        return res.status(200).json({
          data: {
            message: "Upload already completed or in processing",
            videoId: existingVideo._id,
            status: existingVideo.status,
          },
        });
      }
      if (existingVideo.status === "INITIATED") {
        return res.status(200).json({
          data: {
            videoId: existingVideo._id,
            status: existingVideo.status,
          },
        });
      }
    }

    const ext = fileName.substring(fileName.lastIndexOf("."));
    const objectId = uuidv4();
    const key = `videos/${objectId}${ext}`;
    const uploadData = await createMultipartUpload(key, contentType);
    const video = await Video.create({
      owner: req.userId,
      title: title.trim(),
      description: description || "",
      filename: fileName,
      s3UploadId: uploadData.uploadId,
      totalChunks: totalParts,
      status: "INITIATED",
      s3Key: key,
      size: fileSize,
      idempotencyKey: idempotencyKey,
    });
    res.status(201).json({
      data: {
        videoId: video._id,
        status: video.status,
      },
    });
  } catch (error) {
    logger.error("Error in initUploadControllerV2:", error);
    throw new InternalServerError("Could not initiate upload", error as Error);
  }
};

export const getSignedUrlControllerV2 = async (req: Request, res: Response) => {
  const { videoId } = req.params as { videoId: string };

  if (!mongoose.Types.ObjectId.isValid(videoId))
    throw new ValidationError("videoId", "Invalid video ID");

  if (!videoId) throw new ValidationError("videoId", "Video ID is required");

  try {
    const video = await Video.findOne({ _id: videoId, owner: req.userId });

    if (video.status === "FAILED")
      throw new UploadFailedError(
        "Upload previously failed. Please re-initiate upload.",
      );
    if (video.status !== "INITIATED") {
      return res.status(200).json({
        data: {
          videoId: video._id,
          status: video.status,
          message: `Video is currently ${video.status}`,
        },
      });
    }
    const signedUrls = await getUploadPartUrls(
      video.s3Key,
      video.s3UploadId,
      video.totalChunks,
    );
    res.status(200).json({
      data: {
        videoId: video._id,
        signedUrls,
      },
    });
  } catch (error) {
    logger.error("Error in getSignedUrlControllerV2:", error);
    throw new InternalServerError("Could not get signed URL", error as Error);
  }
};

export const completeUploadControllerV2 = async (
  req: Request,
  res: Response,
) => {
  const { videoId } = req.params as { videoId: string };
  const { parts } = req.body as {
    parts: { partNumber: number; etag: string }[];
  };

  if (!mongoose.Types.ObjectId.isValid(videoId))
    throw new ValidationError("videoId", "Invalid video ID");
  if (!Array.isArray(parts) || parts.length === 0)
    throw new ValidationError("parts", "Parts are required to complete upload");

  try {
    const video = await Video.findOne({
      _id: videoId,
      owner: req.userId,
    });

    if (!video) throw new NotFoundError("Requested Video not found");
    if (video.status === "FAILED")
      throw new UploadFailedError(
        "Upload previously failed. Please re-initiate upload.",
      );

    if (video.status !== "INITIATED") {
      return res.status(200).json({
        data: {
          videoId: video._id,
          status: video.status,
          message: `Video is currently ${video.status}`,
        },
      });
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

    res.status(200).json({
      data: {
        videoId: video._id,
        status: video.status,
      },
    });
  } catch (error) {
    logger.error("Error in completeUploadControllerV2:", error);
    throw new InternalServerError("Could not complete upload", error as Error);
  }
};

export const getMyVideosControllerV2 = async (req: Request, res: Response) => {
  try {
    // only fetch videos with status UPLOADED or PROCESSING or READY or FAILED
    const videos = await Video.find({
      owner: req.userId,
      status: { $in: ["UPLOADED", "PROCESSING", "READY", "FAILED"] },
    }).select("_id title description status createdAt url thumbnail duration");
    res.status(200).json({
      data: videos,
    });
  } catch (error) {
    logger.error("Error in getMyVideosControllerV2:", error);
    throw new InternalServerError("Could not fetch videos", error as Error);
  }
};
