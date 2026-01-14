import { Video } from "../models/video.js";
import { v2 } from "cloudinary";
import fs from "fs";
import { logger } from "./winston.js";
import { saveVideoData } from "../cache/index.js";
import { fileClearing } from "./fileClearning.js";

export const uploadVideoToCloudinary = async (videoId, filepath, title) => {
  let err = false;
  let result;
  try {
    result = await v2.uploader.upload(filepath, {
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

    logger.info(`Video File processed successfully : ${videoId}`);

    await Video.findByIdAndUpdate(videoId, {
      status: "READY",
      url: result?.eager[1]?.secure_url || null,
      thumbnail: result.eager?.[2]?.secure_url || null,
    });

    logger.info(`Video File data updated : ${videoId}`);
    console.log(result);
  } catch (error) {
    err = true;
    await Video.findByIdAndUpdate(fileId, {
      status: "FAILED",
      url: null,
      thumbnail: null,
    });
    logger.error(
      `Error while video processing : ${fileId} : ${error?.message}`
    );
  } finally {
    if (filepath) {
      fileClearing(filepath);
      if (err) {
        await saveVideoData(videoId, "FAILED");
        return;
      }
      await saveVideoData(
        videoId,
        "READY",
        title,
        result.eager[1].secure_url,
        result.eager?.[2]?.secure_url
      );
    }
  }
};
