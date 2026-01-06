import { v2 } from "cloudinary";


// Cloudinary config 

export const uploadToCloudinary = async (filepath) => {
  try {
    await v2.uploader.upload(filepath).then((result) => {
      console.log("Upload Successfull :", result);
    });
  } catch (error) {
    console.error("Error while uploading to cloudinary :", error);
  }
};
