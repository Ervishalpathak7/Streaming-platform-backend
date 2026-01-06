import { v2 } from "cloudinary";

import path from "path";

// Cloudinary config
const filepate = path.join(process.cwd(), "src/public");

export const uploadToCloudinary = async (imageName) => {
  try {
    await v2.uploader.upload(`${filepate}/${imageName}`).then((result) => {
      console.log("Upload Successfull :", result);
    });
  } catch (error) {
    console.error("Error while uploading to cloudinary :", error);
  }
};
