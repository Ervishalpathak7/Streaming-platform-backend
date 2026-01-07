import { Video } from "../models/video.js";
import { v2 } from "cloudinary";
import fs from "fs";

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

    await Video.findByIdAndUpdate(fileId, {
      status: "READY",
      url: result.eager?.[0]?.secure_url,
      thumbnail: result.eager?.[1]?.secure_url ?? null,
    });
  } catch (error) {
    await Video.findByIdAndUpdate(fileId, {
      status: "FAILED",
      url: null,
      thumbnail: null,
    });
    console.error("Error in video processing :", error);
  } finally {
    if (filepath) {
      fs.unlink(filepath, (err) => {
        if (err) console.error("Error deleting file : ", err);
      });
    }
  }
};
