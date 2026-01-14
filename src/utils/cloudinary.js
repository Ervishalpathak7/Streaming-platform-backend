import { Video } from "../models/video.js";
import { v2 } from "cloudinary";
import { logger } from "./winston.js";
import { saveVideoData } from "../cache/index.js";
import { fileClearing } from "./fileClearning.js";

export const uploadVideoToCloudinary = async (videoId, filepath, title) => {
  let err = false;
  let url;
  let thumbnail;
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
    url = result?.eager[1]?.secure_url;
    thumbnail = result.eager?.[2]?.secure_url;

    await Video.findByIdAndUpdate(videoId, {
      status: "READY",
      url,
      thumbnail,
    });

    logger.info(`Video File data updated : ${videoId}`);
  } catch (error) {
    err = true;
    await Video.findByIdAndUpdate(fileId, {
      status: "FAILED",
      url,
      thumbnail,
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
      await saveVideoData(videoId, "READY", title, url, thumbnail);
    }
  }
};
