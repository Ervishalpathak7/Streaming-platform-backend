import { Schema, model, Types } from "mongoose";
import { z } from "zod";

const videoSchemaType = z.object({
  owner: z.instanceof(Types.ObjectId),
  filename: z.string().max(255, "Filename must be at most 255 characters"),
  title: z.string().max(100, "Title must be at most 100 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  status: z
    .enum(["INITIATED", "UPLOADED", "PROCESSING", "READY", "FAILED"])
    .default("INITIATED"),
  totalChunks: z.number().min(1, "Total chunks must be at least 1"),
  s3UploadId: z
    .string()
    .max(255, "S3 Upload ID must be at most 255 characters"),
  idempotencyKey: z
    .string()
    .max(255, "Idempotency Key must be at most 255 characters"),
  url: z.url().optional(),
  s3Key: z.string().max(255, "S3 Key must be at most 255 characters"),
  thumbnail: z.url().optional(),
  duration: z.number().optional(),
  size: z.number().optional(),
  error: z.string().optional(),
});

export type VideoType = z.infer<typeof videoSchemaType>;

type VideoStatus = "INITIATED" | "UPLOADED" | "PROCESSING" | "READY" | "FAILED";

const VideoSchema = new Schema<VideoType>(
  {
    owner: {
      type: Types.ObjectId,
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
      enum: [
        "INITIATED",
        "UPLOADED",
        "PROCESSING",
        "READY",
        "FAILED",
      ] as VideoStatus[],
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
  { timestamps: true },
);

// Dashboard queries
VideoSchema.index({ owner: 1, createdAt: -1 });

// Processing workers / monitoring
VideoSchema.index({ status: 1, updatedAt: -1 });

const Video = model<VideoType>("Videos", VideoSchema);
export default Video;
