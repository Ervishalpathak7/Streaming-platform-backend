import { Schema, model, Types } from "mongoose";

export interface IRefreshToken {
  token: string;
  userId: Types.ObjectId;
  expiresAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
  expiresAt: { type: Date, required: true },
});

const RefreshToken = model<IRefreshToken>("RefreshToken", refreshTokenSchema);

export default RefreshToken;
