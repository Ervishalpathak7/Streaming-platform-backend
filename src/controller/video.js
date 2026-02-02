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
    const idempotencyKey = req?.headers?.["idempotency-key"];
    if (!idempotencyKey) throw new AppError("No Idempotency Key", 400);
    const { title, description } = req.body;
    if (!title) throw new AppError("Title is required", 400);

    const existingVideo = await Video.findOne({
      idempotencyKey: idempotencyKey,
    });

    if (existingVideo) {
      res.status(201).json({
        videoId: existingVideo._id,
        title: existingVideo.title,
        status: existingVideo.status,
        url: existingVideo.url,
        thumbnail: existingVideo.thumbnail,
      });
      fileClearing(uploadedFile.path);
      return;
    }

    const savedVideo = await Video.create({
      owner: req.userId,
      status: "PROCESSING",
      title,
      des : description || "",
      filename: uploadedFile.originalname,
      idempotencyKey: idempotencyKey,
    });

    res.status(200).json({
      status: "Processing",
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

export const getVideoControllerbyId = async (req, res) => {
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
      url: cachedVideo.url || null,
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
    url: video.status === "READY" ? video.url : null,
    thumbnail: video.thumbnail || null,
  });
  saveVideoData(videoId, video.status, video.title, video.url, video.thumbnail);
};

export const getMyVideos = async (req, res) => {
  const userId = req.userId;

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 10);
  const skip = (page - 1) * limit;
  const filter = { owner: userId };
  if (req.query.status) filter.status = req.query.status;

  const [videos, total] = await Promise.all([
    Video.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select(
        "_id des status url title thumbnail duration createdAt"
      ),
    Video.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    videos: videos,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}