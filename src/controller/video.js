import { uploadToCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.js";
import fs from "fs";
let filepath;

export const uploadVideoController = async (req, res) => {
  try {
    const uploadedFile = req?.file;
    if (!uploadedFile) {
      res.status(500).json({
        message: "Error Uploading file",
      });
      return;
    }
    filepath = uploadedFile.path;
    // upload it to cloudinary
    const uploadedFileToCloudinary = await uploadToCloudinary(filepath);
    // save data into mongodb
    const savedVideo = await Video.create({
      owner: req.userId,
      url: uploadedFileToCloudinary.secure_url,
      filename: uploadedFileToCloudinary.original_filename,
    });

    if (savedVideo) {
      res.status(200).json({
        message: "Video uploaded succesfully",
        video: {
          id: savedVideo._id,
          name: savedVideo.filename,
          url: savedVideo.url,
        },
      });
      return;
    }

    res.status(500).json({
      message: "Error Saving video data",
      url: "fileUrl",
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "internal server error",
    });
    console.error("error in video uploading controller :", error);
  } finally {
    if (filepath) {
      fs.unlink(filepath, (err) => {
        if (err) throw err;
      });
    }
  }
};
