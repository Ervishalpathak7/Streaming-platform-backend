import User from "@/models/user.model";
import { AppError, ConflictError, UnauthorizedError } from "@/error";
import { comparePassword, hashPassword } from "@/lib/bcrypt";
import { MongoError } from "mongodb";
import { InternalServerError } from "@/error/index.js";
import redisClient from "@/config/redis";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
} from "@/lib/jwt";
import RefreshToken from "@/models/refreshToken";
import logger from "@/lib/winston";

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const result = await redisClient.get(`bl:${token}`);
  return result === "blacklisted";
};

export const registerService = async (
  name: string,
  email: string,
  password: string,
) => {
  // Hash password
  const hashedPassword = await hashPassword(password);
  // Create new user
  try {
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const refreshToken = await generateRefreshToken(
      newUser._id.toString(),
      newUser.role,
    );

    const refreshTokenDoc = await RefreshToken.create({
      token: refreshToken,
      userId: newUser._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      id: newUser._id,
      role: newUser.role,
      refreshToken: refreshTokenDoc.token,
    };
  } catch (error) {
    if (error instanceof MongoError && error.code === 11000) {
      throw new ConflictError("Email already in use");
    }
    if (error instanceof AppError) throw error;
    logger.error("Error in registerService:", {
      name,
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new InternalServerError(
      "Unexpected error during registration in registerService",
      error instanceof Error ? error : new Error(String(error)),
    );
  }
};

export const loginService = async (email: string, password: string) => {
  try {
    const user = await User.findOne({ email });
    if (!user) throw new UnauthorizedError("Invalid email or password");

    const isPasswordValid = await comparePassword(
      password,
      user.password as string,
    );
    if (!isPasswordValid)
      throw new UnauthorizedError("Invalid email or password");

    const refreshToken = await generateRefreshToken(
      user._id.toString(),
      user.role,
    );

    const refreshTokenDoc = await RefreshToken.findOneAndUpdate(
      { userId: user._id },
      {
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      { upsert: true, new: true },
    );
    return {
      id: user._id,
      role: user.role,
      refreshToken: refreshTokenDoc.token,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error("Error in loginService:", {
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new InternalServerError(
      "Unexpected error during login in loginService",
      error instanceof Error ? error : new Error(String(error)),
    );
  }
};

export const logoutService = async (
  accessToken: string,
  refreshToken: string,
) => {
  const deletedToken = await RefreshToken.findOneAndDelete({
    token: refreshToken,
  });
  if (!deletedToken) throw new UnauthorizedError("Invalid refresh token");

  const payload = verifyAccessToken(accessToken);
  const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
  await redisClient.set(`bl:${accessToken}`, "blacklisted", "EX", expiresIn);
  return;
};

export const refreshTokenService = async (refreshToken: string) => {
  const existingToken = await RefreshToken.findOne({ token: refreshToken });
  if (!existingToken) throw new UnauthorizedError("Invalid refresh token");

  if (existingToken.expiresAt < new Date()) {
    await RefreshToken.deleteOne({ token: refreshToken });
    throw new UnauthorizedError("Refresh token expired");
  }
  const user = await User.findById(existingToken.userId);
  if (!user) {
    await RefreshToken.deleteOne({ token: refreshToken });
    throw new UnauthorizedError("User not found");
  }
  const newAccessToken = await generateAccessToken(
    user._id.toString(),
    user.role,
  );

  return newAccessToken;
};
