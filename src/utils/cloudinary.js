import { Video } from "../models/video.js";
import { v2 } from "cloudinary";
import { logger } from "./winston.js";
import { fileClearing } from "./fileClearning.js";

export const uploadVideoToCloudinary = async (videoId, videoPath) => {
  try {
    const result = await v2.uploader.upload_large(videoPath, {
      resource_type: "video",
      public_id: videoId,
      folder: "videos",

      chunk_size: 6 * 1024 * 1024, // 6MB

      eager: [
        {
          streaming_profile: "auto",
          format: "m3u8",
        },
        {
          width: 320,
          height: 240,
          crop: "fill",
          format: "jpg",
          start_offset: "auto",
        },
      ],

      eager_async: true,

      eager_notification_url: process.env.CLOUDINARY_WEBHOOK_URL,
    });

    logger.info("Cloudinary upload accepted", {
      videoId,
      bytes: result.bytes,
    });

    // Only mark PROCESSING here
    await Video.findByIdAndUpdate(videoId, {
      status: "PROCESSING",
      size: result.bytes,
    });
  } catch (error) {
    await Video.findByIdAndUpdate(videoId, {
      status: "FAILED",
      error: "Cloudinary upload failed",
    });

    logger.error("Video upload failed in Cloudinary", {
      category: "external",
      service: "cloudinary",
      lifecycle: "upload",
      code: "VIDEO_UPLOAD_FAILED",
      videoId,
      videoPath,
      error,
    });
    throw error;
  } finally {
    if (videoPath) {
      fileClearing(videoPath);
    }
  }
};
