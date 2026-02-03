import { pipeline } from "stream/promises";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import Busboy from "busboy";
import path from "path";
import fs from "fs";
import { AppError } from "../error/index.js";
import { Video } from "../models/video.js";
import { uploadVideoToCloudinary } from "../utils/cloudinary.js";
import { logger } from "../utils/winston.js";
import { saveVideoData, getVideoData } from "../cache/index.js";

const UPLOAD_ROOT = "./uploads";

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
};

export const initUploadController = async (req, res) => {
  const { fileName, fileSize, mimeType, totalChunks, title, description } =
    req.body;

  if (!title || title.trim().length < 3)
    throw new AppError("Title is required", 400);

  if (!fileName || !totalChunks)
    throw new AppError("Invalid upload metadata", 400);

  const uploadId = uuidv4();

  const uploadDir = path.join(UPLOAD_ROOT, uploadId);
  fs.mkdirSync(uploadDir, { recursive: true });

  const video = await Video.create({
    owner: req.userId,
    title: title.trim(),
    description: description || "",
    status: "UPLOADING",
    uploadId,
    totalChunks,
    filename: fileName,
  });
  res.status(201).json({
    data: {
      uploadId,
      videoId: video._id,
    },
  });
};


export const uploadChunkController = async (req, res) => {
  const busboy = Busboy({ headers: req.headers });

  let uploadId;
  let chunkIndex;
  let totalChunks;

  busboy.on("field", (name, value) => {
    if (name === "uploadId") uploadId = value;
    if (name === "chunkIndex") chunkIndex = Number(value);
    if (name === "totalChunks") totalChunks = Number(value);
  });

  busboy.on("file", (_, file) => {
    if (!uploadId || chunkIndex === undefined)
      throw new AppError("Invalid chunk metadata", 400);

    const chunkPath = path.join(
      UPLOAD_ROOT,
      uploadId,
      `${chunkIndex}.part`,
    );

    // Idempotency: chunk already exists
    if (fs.existsSync(chunkPath)) {
      file.resume();
      return res.status(200).json({ status: "Chunk exists" });
    }
    const writeStream = fs.createWriteStream(chunkPath);
    file.pipe(writeStream);
  });

  busboy.on("finish", async () => {
    await Video.updateOne(
      { uploadId },
      { $addToSet: { receivedChunks: chunkIndex } },
    );

    res.status(200).json({ status: "Chunk uploaded" });
  });

  req.pipe(busboy);
};

export const completeUploadController = async (req, res) => {
  const { uploadId } = req.body;

  const video = await Video.findOne({ uploadId });
  if (!video) throw new AppError("Upload not found", 404);

  if (video.receivedChunks.length !== video.totalChunks)
    throw new AppError("Upload incomplete", 400);

  res.status(200).json({ status: "Merging started" });


  logger.info(`Starting merge for uploadId: ${uploadId}`);

  setImmediate(async () => {
    const uploadDir = path.join(UPLOAD_ROOT, uploadId);
    const finalPath = path.join(uploadDir, "final.mp4");

    try {
      await Video.updateOne(
        { _id: video._id },
        { status: "MERGING" },
      );

      const writeStream = fs.createWriteStream(finalPath);

      for (let i = 0; i < video.totalChunks; i++) {
        const chunkPath = path.join(uploadDir, `${i}.part`);

        if (!fs.existsSync(chunkPath)) {
          throw new Error(`Missing chunk ${i} for uploadId ${uploadId}`);
        }

        await pipeline(
          fs.createReadStream(chunkPath),
          writeStream,
          { end: false },
        );

        fs.unlinkSync(chunkPath);
      }

      writeStream.end();
      await new Promise((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });

      logger.info(`Merge completed for uploadId: ${uploadId}`);

      await Video.updateOne(
        { _id: video._id },
        { status: "PROCESSING" },
      );

      logger.info(`Starting upload to Cloudinary for videoId: ${video._id}`);
      await uploadVideoToCloudinary(video._id, finalPath, video.title);

      fs.rmSync(uploadDir, { recursive: true, force: true });

      logger.info(`Upload finished and temp files cleaned for uploadId: ${uploadId}`);
    } catch (err) {
      logger.error("Merge or upload failed", {
        uploadId,
        videoId: video._id,
        err,
      });

      await Video.updateOne(
        { _id: video._id },
        {
          status: "FAILED",
          error: err.message || "Merge failed",
        },
      );
    }
  });

};


export const getUploadStatusController = async (req, res) => {
  const { uploadId } = req.params;

  const video = await Video.findOne({ uploadId }).select(
    "status totalChunks receivedChunks",
  );

  if (!video) throw new AppError("Upload not found", 404);

  // Resume only makes sense here
  if (video.status !== "UPLOADING") {
    return res.status(200).json({
      data: {
        status: video.status,
        resumable: false,
      },
    });
  }

  res.status(200).json({
    data: {
      status: video.status,
      resumable: true,
      totalChunks: video.totalChunks,
      receivedChunks: video.receivedChunks,
    },
  });
};

export const cloudinaryWebhookController = async (req, res) => {
  try {
    const payload = req.body;

    // We only care about eager notifications
    if (payload.notification_type !== "eager") {
      return res.status(200).send("Ignored");
    }

    if (!payload.public_id || !Array.isArray(payload.eager)) {
      return res.status(400).send("Invalid payload");
    }

    const videoId = payload.public_id.split("/").pop();

    const hls = payload.eager.find(e => e.format === "m3u8");
    const thumbnail = payload.eager.find(e => e.format === "jpg");

    if (!hls) {
      logger.warn("Eager webhook without HLS", { payload });
      return res.status(200).send("No HLS yet");
    }

    await Video.findByIdAndUpdate(videoId, {
      status: "READY",
      url: hls.secure_url,
      thumbnail: thumbnail?.secure_url,
    });

    logger.info("Video marked READY via Cloudinary webhook", { videoId });

    res.status(200).send("OK");
  } catch (err) {
    logger.error("Cloudinary webhook handling failed", {
      err,
      body: req.body,
    });
    res.status(500).send("Webhook error");
  }
};
