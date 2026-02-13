import { MongoError } from "mongodb";
import logger from "@/lib/winston.js";
import User from "@/models/user.model.js";
import redisClient from "@/config/redis.js";
import RefreshToken from "@/models/refreshToken.js";
import { AppError, normalizeError } from "@/error/index.js";
import { comparePassword, hashPassword } from "@/lib/bcrypt.js";
import {
  ConflictError,
  InternalServerError,
  UnauthorizedError,
} from "@/error/errors.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/lib/jwt.js";
import { AUTH_CONFIG } from "@/config/constants.js";

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
      expiresAt: new Date(Date.now() + AUTH_CONFIG.REFRESH_TOKEN_COOKIE_MAX_AGE),
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
      error: normalizeError(error),
    });
    throw new InternalServerError(
      "Unexpected error during registration in registerService",
      normalizeError(error),
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
        expiresAt: new Date(Date.now() + AUTH_CONFIG.REFRESH_TOKEN_COOKIE_MAX_AGE),
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
      normalizeError(error),
    );
  }
};

export const logoutService = async (
  accessToken: string,
  refreshToken: string,
) => {
  // Blacklist access token first to prevent race condition
  try {
    const payload = verifyAccessToken(accessToken);
    const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
    if (expiresIn > 0) {
      await redisClient.set(`bl:${accessToken}`, "blacklisted", "EX", expiresIn);
    }
  } catch (error) {
    // If token is invalid/expired, still proceed with refresh token deletion
    logger.warn("Access token verification failed during logout", {
      error: normalizeError(error),
    });
  }

  // Delete refresh token
  const deletedToken = await RefreshToken.findOneAndDelete({
    token: refreshToken,
  });
  if (!deletedToken) throw new UnauthorizedError("Invalid refresh token");
  
  return;
};

export const refreshTokenService = async (refreshToken: string) => {
  try {
    // First verify the token signature
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const existingToken = await RefreshToken.findOne({ token: refreshToken });
    if (!existingToken) throw new UnauthorizedError("Invalid refresh token");

    if (existingToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ token: refreshToken });
      throw new UnauthorizedError("Refresh token expired");
    }

    // Verify token belongs to the user in database
    if (existingToken.userId.toString() !== decoded.userId) {
      await RefreshToken.deleteOne({ token: refreshToken });
      throw new UnauthorizedError("Token user mismatch");
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
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error("Error in refreshTokenService:", {
      refreshToken,
      error: normalizeError(error),
    });
    throw new InternalServerError(
      "Unexpected error during token refresh in refreshTokenService",
      normalizeError(error),
    );
  }
};
