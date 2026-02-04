import { v4 as uuidv4 } from "uuid";
import path from "path";
import { AppError } from "../../error/index.js";
import { logger } from "../../utils/winston.js";
import { createMultipartUpload } from "../../services/s3.js";
import { Video } from "../../models/video.js";
import { getUploadPartUrls } from "../../services/s3.js";
import s3, { CHUNK_SIZE } from "../../config.js";
import mongoose from "mongoose";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";

export const initUploadControllerV2 = async (req, res) => {
    const { title, description, filename, filesize, mimetype, duration } = req.body || {};
    const idempotencyKey = req.headers["idempotency-key"] || null;

    if (!idempotencyKey)
        throw new AppError("Idempotency key is required", 400);

    if (!title || title.trim().length < 3)
        throw new AppError("Title is required", 400);

    if (!filename || filename.trim().length === 0)
        throw new AppError("Invalid filename", 400);

    if (!filesize || filesize <= 0)
        throw new AppError("Invalid file size", 400);

    if (!mimetype || !mimetype.startsWith("video/"))
        throw new AppError("Invalid MIME type", 400);

    if (filesize > 1 * 1024 * 1024 * 1024)
        throw new AppError("Max file size is 1GB", 400);

    if (!duration || duration <= 0)
        throw new AppError("Invalid video duration", 400);

    const ext = path.extname(filename).toLowerCase() || ".mp4";
    if (![".mp4", ".mkv", ".mov", ".avi"].includes(ext))
        throw new AppError("Unsupported file extension", 400);

    try {
        const totalParts = Math.ceil(filesize / CHUNK_SIZE);
        const existingVideo = await Video.findOne({ owner: req.userId, idempotencyKey });
        if (existingVideo) {
            if (existingVideo.status === "UPLOADED" || existingVideo.status === "PROCESSING") {
                return res.status(200).json({
                    data: {
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

        const objectId = uuidv4();
        const key = `videos/${objectId}${ext}`;
        const uploadData = await createMultipartUpload(key, mimetype);
        const video = await Video.create({
            owner: req.userId,
            title: title.trim(),
            description: description || "",
            filename: filename,
            s3UploadId: uploadData.uploadId,
            totalChunks: totalParts,
            status: "INITIATED",
            s3Key: key,
            size: filesize,
            duration: duration,
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
        throw new AppError("Could not initiate upload", 500);
    }
};

export const getSignedUrlControllerV2 = async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId))
        throw new AppError("Invalid video ID", 400);

    if (!videoId)
        throw new AppError("Video ID is required", 400);

    try {
        const video = await Video.findOne({ _id: videoId, owner: req.userId });

        if (video.status === "FAILED")
            throw new AppError("Upload previously failed. Please re-initiate upload.", 400);
        if (video.status !== "INITIATED") {
            return res.status(200).json({
                data: {
                    videoId: video._id,
                    status: video.status,
                    message: `Video is currently ${video.status}`,
                },
            });
        }
        const signedUrls = await getUploadPartUrls(video.s3Key, video.s3UploadId, video.totalChunks);
        res.status(200).json({
            data: {
                videoId: video._id,
                signedUrls,
            },
        });
    } catch (error) {
        logger.error("Error in getSignedUrlControllerV2:", error);
        throw new AppError("Could not get signed URL", 500);
    }
}

export const completeUploadControllerV2 = async (req, res) => {
    const { videoId } = req.params;
    const { parts } = req.body;

    if (!mongoose.Types.ObjectId.isValid(videoId))
        throw new AppError("Invalid video ID", 400);
    if (!Array.isArray(parts) || parts.length === 0)
        throw new AppError("Parts are required to complete upload", 400);

    try {
        const video = await Video.findOne({
            _id: videoId,
            owner: req.userId,
        });

        if (!video)
            throw new AppError("Video not found", 404);
        if (video.status === "FAILED")
            throw new AppError(
                "Upload previously failed. Please re-initiate upload.",
                400
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
                    Parts: parts.map(p => ({
                        PartNumber: p.partNumber,
                        ETag: p.etag,
                    })),
                },
            })
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
        throw new AppError("Could not complete upload", 500);
    }
};

export const getMyVideosControllerV2 = async (req, res) => {
    try {
        const videos = await Video.find({ owner: req.userId }).select(
            "_id title description status createdAt url thumbnail duration"
        );
        res.status(200).json({
            data: videos,
        });
    } catch (error) {
        logger.error("Error in getMyVideosControllerV2:", error);
        throw new AppError("Could not get videos", 500);
    }
};