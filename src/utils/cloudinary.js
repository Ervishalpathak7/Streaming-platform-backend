import { Video } from "../models/video.js";
import { v2 } from "cloudinary";
import fs from "fs";
import { handleBackgroundError } from "../error/backgroundErrorHandler.js";
import { logger } from "./winston.js";

export const uploadVideoToCloudinary = async (fileId, filepath) => {
  try {
    const result = await v2.uploader.upload(filepath, {
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

    logger.info(`Video File processed successfully : ${fileId}`);
    console.log(result.eager[1].secure_url);

    await Video.findByIdAndUpdate(fileId, {
      status: "READY",
      url: result?.eager[1]?.secure_url || null,
      thumbnail: result.eager?.[1]?.secure_url || null,
    });

    logger.info(`Video File data updated : ${fileId}`);
  } catch (error) {
    await Video.findByIdAndUpdate(fileId, {
      status: "FAILED",
      url: null,
      thumbnail: null,
    });

    handleBackgroundError(error, "VIDEO PROCESSING", { fileId });
  } finally {
    if (filepath) {
      fs.unlink(filepath, (err) => {
        if (err)
          logger.error(`Error while deleting file : ${err?.message}`, {
            stack: err?.stack,
          });
      });
    }
  }
};
