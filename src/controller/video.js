import { AppError } from "../error/index.js";
import { Video } from "../models/video.js";
import { uploadVideoToCloudinary } from "../utils/cloudinary.js";

export const uploadVideoController = async (req, res) => {
  const uploadedFile = req.file;

  if (!uploadedFile) throw new AppError("Invalid file", 400);

  const savedVideo = await Video.create({
    owner: req.userId,
    status: "PROCESSING",
    filename: uploadedFile.originalname,
  });

  res.status(200).json({
    message: "Video processing",
    videoId: savedVideo._id,
  });

  uploadVideoToCloudinary(savedVideo._id, uploadedFile.path);
};
