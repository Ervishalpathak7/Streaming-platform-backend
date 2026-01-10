import mongoose, { Schema } from "mongoose";

const VideoSchema = new Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  url: {
    type: String,
  },
  status: {
    type: String,
    enum: ["PROCESSING", "READY", "FAILED"],
    default: "PROCESSING",
    required: true,
  },
  thumbnail: {
    type: String,
  },
  idempotencyKey: {
    type: String,
    required: true,
  },
});

export const Video = new mongoose.model("Videos", VideoSchema);
