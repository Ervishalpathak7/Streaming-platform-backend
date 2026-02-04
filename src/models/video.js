import { Schema, model } from "mongoose";

const VideoSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    filename: {
      type: String,
      required: true,
    },
    // ========= Upload tracking =========
    s3UploadId: {
      type: String,
      required: true,
      unique: true,
    },
    totalChunks: {
      type: Number,
      required: true,
      min: 1,
    },
    // ========= Processing =========
    status: {
      type: String,
      enum: [ "INITIATED" ,"UPLOADED", "PROCESSING", "READY", "FAILED"],
      default: "INITIATED",
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    url: {
      type: String,
      default: null,
    },
    thumbnail: {
      type: String,
      default: null,
    },
    duration: {
      type: Number,
    },
    size: {
      type: Number,
    },
    error: {
      type: String,
    },
  },
  { timestamps: true }
);

// Dashboard queries
VideoSchema.index({ owner: 1, createdAt: -1 });

// Processing workers / monitoring
VideoSchema.index({ status: 1, updatedAt: -1 });

export const Video = model("Videos", VideoSchema);