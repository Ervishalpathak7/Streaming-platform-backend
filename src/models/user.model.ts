import { Schema, model, Types } from "mongoose";
import { z } from "zod";

export const userSchemaType = z.object({
  name: z.string(),
  email: z
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(20, "Password must be less than 20 characters")
    .nullable(),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
  videos: z.array(z.instanceof(Types.ObjectId)).optional(),
});

export type User = z.infer<typeof userSchemaType>;

const UserSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    videos: [
      {
        type: Types.ObjectId,
        ref: "Videos",
      },
    ],
  },
  { timestamps: true },
);

UserSchema.index({ email: 1 }, { unique: true });

const User = model<User>("Users", UserSchema);
export default User;
