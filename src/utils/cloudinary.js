import { Video } from "../models/video.js";
import { v2 } from "cloudinary";
import { logger } from "./winston.js";
import { saveVideoData } from "../cache/index.js";
import { fileClearing } from "./fileClearning.js";

export const uploadVideoToCloudinary = async (videoId, videoPath, title) => {
  let err = false;
  let url;
  let thumbnail;
  try {
    const result = await v2.uploader.upload(videoPath, {
      resource_type: "video",
      eager: [
        {
          streaming_profile: "auto",
        },
        {
          format: "m3u8",
          quality: "auto",
        },
        {
          width: 320,
          height: 240,
          crop: "fill",
          format: "jpg",
          start_offset: "auto",
        },
      ],
    });

    url = result?.eager[1]?.secure_url;
    thumbnail = result.eager?.[2]?.secure_url;
    logger.info(`Video File processed successfully : ${videoId}`);
    await Video.findByIdAndUpdate(videoId, {
      status: "READY",
      url,
      thumbnail,
    });
    logger.info(`Video File data updated : ${videoId}`);
  } catch (error) {
    err = true;
    await Video.findByIdAndUpdate(videoId, {
      status: "FAILED",
      url,
      thumbnail,
    });
    logger.error("Video processing failed in Cloudinary", {
      category: "external",
      service: "cloudinary",
      lifecycle: "process",
      code: "VIDEO_PROCESSING_FAILED",
      videoId,
      videoPath,
      error: error?.message,
      stack: error?.stack
    });
  } finally {
    if (videoPath) {
      fileClearing(videoPath);
      if (!err) {
        await saveVideoData(videoId, "READY", title, url, thumbnail);
        return;
      }
      await saveVideoData(videoId, "FAILED");
    }
  }
};
