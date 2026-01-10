import { AppError } from "../error/index.js";
import { Video } from "../models/video.js";
import { uploadVideoToCloudinary } from "../utils/cloudinary.js";
import { logger } from "../utils/winston.js";

export const uploadVideoController = async (req, res) => {
  const idempotencyKey = req?.headers?.idempotencykey;
  if (!idempotencyKey) throw new AppError("No Idempotency Key", 400);
  const uploadedFile = req.file;
  if (!uploadedFile) throw new AppError("Invalid file", 400);

  const ExistingVideo = await Video.findOne({ idempotencyKey: idempotencyKey });
  if (ExistingVideo) {
    res.status(200).json({
      message: ExistingVideo.status,
      videoId: ExistingVideo._id,
    });
    return;
  }

  const savedVideo = await Video.create({
    owner: req.userId,
    status: "PROCESSING",
    filename: uploadedFile.originalname,
    idempotencyKey: idempotencyKey,
  });

  res.status(200).json({
    message: "Video processing",
    videoId: savedVideo._id,
  });
  logger.info(`A New Video Recieved : ${savedVideo._id}`);

  uploadVideoToCloudinary(savedVideo._id, uploadedFile.path);
};

export const getVideoController = async (req , res) => {

};
