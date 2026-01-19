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
    },
    des: {
      type: String,
      default: null,
    },
    filename: {
      type: String,
      required: true,
    },
    url: String,
    duration : Number,
    status: {
      type: String,
      enum: ["PROCESSING", "READY", "FAILED"],
      default: "PROCESSING",
      required: true,
    },
    thumbnail: String,
    idempotencyKey: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

VideoSchema.index({ idempotencyKey: 1 }, { unique: true });
VideoSchema.index(
  { owner: 1, createdAt: -1 },
  { partialFilterExpression: { status: "READY" } }
);


export const Video = new model("Videos", VideoSchema);
