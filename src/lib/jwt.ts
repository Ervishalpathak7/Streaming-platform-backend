import jwt from "jsonwebtoken";
import { AppError, UnauthorizedError } from "@/error/index.js";
import type { Types } from "mongoose";
import logger from "@/lib/winston.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export const generateAccessToken = async (userId: Types.ObjectId) => {
  try {
    return jwt.sign({ userId: userId }, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "30MINUTES",
    });
  } catch (error) {
    logger.warn("JWT token generation failed", {
      category: "user",
      service: "jwt",
      lifecycle: "request",
      code: "JWT_GENERATION_FAILED",
      error,
    });
    throw new AppError(
      "Token Generation failed",
      500,
      new Error("JWT generation error"),
    );
  }
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
  } catch (error) {
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      throw new UnauthorizedError("Invalid or expired token");
    }
    logger.warn("JWT token verification failed", {
      category: "user",
      service: "jwt",
      lifecycle: "request",
      code: "JWT_VERIFICATION_FAILED",
      error,
    });
    throw new AppError(
      "Token verification failed",
      500,
      new Error("JWT verification error"),
    );
  }
};
