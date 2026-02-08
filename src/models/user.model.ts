import mongoose, { Schema, Model } from "mongoose";
import { z } from "zod";

const userSchemaType = z.object({
  name: z.string(),
  email: z
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(20, "Password must be less than 20 characters"),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
  files: z.array(z.string()),
});

export type User = z.infer<typeof userSchemaType>;

const UserSchema = new Schema<User>(
  {
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
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    files: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
      },
    ],
  },
  { timestamps: true },
);

UserSchema.index({ email: 1 }, { unique: true });

const User: Model<User> = mongoose.model<User>("User", UserSchema);
export default User;
