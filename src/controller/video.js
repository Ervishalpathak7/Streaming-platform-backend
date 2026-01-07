import { Video } from "../models/video.js";
import { uploadVideoToCloudinary } from "../utils/cloudinary.js";

export const uploadVideoController = async (req, res) => {
  try {
    const uploadedFile = req?.file;
    if (!uploadedFile) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }
    const savedVideo = await Video.create({
      owner: req.id,
      status: "PROCESSING",
      filename: uploadedFile.originalname,
    });
    res.status(200).json({
      message: "Video processing",
      videoId: savedVideo._id,
    });
    uploadVideoToCloudinary(savedVideo._id, uploadedFile.path);
  } catch (error) {
    res.status(500).json({
      message: "internal server error",
    });
    console.error("error in video uploading controller :", error);
  }
};
