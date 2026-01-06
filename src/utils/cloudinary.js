import { v2 } from "cloudinary";
// Cloudinary config

export const uploadToCloudinary = async (filepath) => {
  try {
    return await v2.uploader.upload(filepath);
  } catch (error) {
    console.error("Error while uploading to cloudinary :", error);
  }
};
