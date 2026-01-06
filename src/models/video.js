import mongoose, { Schema } from "mongoose";

const VideoSchema = new Schema({
  owner: {
    type: "ObjectId",
    ref: "Users",
    require: true,
  },
  filename: {
    type: String,
    require: true,
  },
  url: {
    type: String,
    require: true,
  },
});

export const Video = new mongoose.model("Videos", VideoSchema);
