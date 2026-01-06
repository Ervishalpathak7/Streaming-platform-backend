import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  name: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
    lowercase: true,
  },
  password: {
    type: String,
    require: true,
  },
  files: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Videos",
  },
});

export const User = mongoose.model("Users", UserSchema);
