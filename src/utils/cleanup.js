import fs from "fs";
import path from "path";
import { logger } from "./winston.js";
import { Video } from "../models/video.js";

const UPLOAD_ROOT = "/tmp/uploads";
const UPLOAD_TTL_MS = 60 * 60 * 1000; // 1 hour

export const cleanupAbandonedUploads = async () => {
    const cutoff = new Date(Date.now() - UPLOAD_TTL_MS);
    const abandonedVideos = await Video.find({
        status: "UPLOADING",
        updatedAt: { $lt: cutoff },
    }).select("_id uploadId");

    for (const video of abandonedVideos) {
        const uploadDir = path.join(UPLOAD_ROOT, video.uploadId);

        try {
            if (fs.existsSync(uploadDir)) {
                fs.rmSync(uploadDir, { recursive: true, force: true });
            }

            await Video.updateOne(
                { _id: video._id },
                {
                    status: "FAILED",
                    error: "Upload abandoned by client",
                },
            );
            logger.warn("Abandoned upload cleaned", {
                videoId: video._id,
                uploadId: video.uploadId,
            });
        } catch (err) {
            logger.error("Failed to cleanup abandoned upload", {
                videoId: video._id,
                uploadId: video.uploadId,
                err,
            });
            throw err;
        }
    }
};
