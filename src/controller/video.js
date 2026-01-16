import mongoose from "mongoose";
import { AppError } from "../error/index.js";
import { Video } from "../models/video.js";
import { uploadVideoToCloudinary } from "../utils/cloudinary.js";
import { logger } from "../utils/winston.js";
import { fileClearing } from "../utils/fileClearning.js";
import { saveVideoData, getVideoData } from "../cache/index.js";

export const createVideoController = async (req, res) => {
  const uploadedFile = req.file;
  if (!uploadedFile) throw new AppError("Invalid file", 400);
  try {
    const idempotencyKey = req?.headers?.idempotencykey;
    if (!idempotencyKey) throw new AppError("No Idempotency Key", 400);
    const { title, description } = req.body;
    if (!title) throw new AppError("Title is required", 400);

    const ExistingVideo = await Video.findOne({
      idempotencyKey: idempotencyKey,
    });
    if (ExistingVideo) {
      res.status(200).json({
        message: ExistingVideo.status,
        videoId: ExistingVideo._id,
      });
      return;
    }

    const savedVideo = await Video.create({
      owner: req.userId,
      status: "PROCESSING",
      title,
      description,
      filename: uploadedFile.originalname,
      idempotencyKey: idempotencyKey,
    });

    res.status(200).json({
      message: "Video processing",
      videoId: savedVideo._id,
    });
    saveVideoData(savedVideo._id, savedVideo.status, title);
    logger.info(`A New Video Recieved : ${savedVideo._id}`);
    uploadVideoToCloudinary(savedVideo._id, uploadedFile.path, title);
  } catch (error) {
    fileClearing(uploadedFile.path);
    if (error instanceof AppError) throw error;
    logger.error("Video upload failed", {
      category: "server",
      service: "video-upload",
      lifecycle: "request",
      code: "VIDEO_UPLOAD_FAILED",
      error,
    });
  }
};

export const getVideoController = async (req, res) => {
  const { id: videoId } = req.params;
  if (!videoId) throw new AppError("Video id is required", 400);

  if (!mongoose.isValidObjectId(videoId))
    throw new AppError("Invalid video Id", 404);

  const cachedVideo = await getVideoData(videoId);
  if (cachedVideo) {
    res.status(200).json({
      videoId,
      title: cachedVideo.title,
      status: cachedVideo.status,
      streamUrl: cachedVideo.url || null,
      thumbnail: cachedVideo.thumbnail || null,
    });
    logger.info("Cache Hit");
    return;
  }
  logger.info("Cache Miss");
  const video = await Video.findById(videoId);
  if (!video) throw new AppError("No video found", 404);
  res.status(200).json({
    videoId: video._id,
    title: video.title,
    status: video.status,
    streamUrl: video.status === "READY" ? video.url : null,
    thumbnail: video.thumbnail || null,
  });
  saveVideoData(videoId, video.status, video.title, video.url, video.thumbnail);
};
