import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  name: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
    unique : true,
    lowercase: true,
  },
  password: {
    type: String,
    require: true,
  },
  role: {
    type: String,
    enum: ["USER", "ADMIN"],
    default: "USER",
  },
  files: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Videos",
  },
});

UserSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model("Users", UserSchema);
