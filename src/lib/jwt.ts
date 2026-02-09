import jwt from "jsonwebtoken";
import { AppError, UnauthorizedError } from "@/error/index.js";
import logger from "@/lib/winston.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export const generateAccessToken = async (userId: string, role: string) => {
  try {
    return jwt.sign({ userId: userId, role: role }, JWT_SECRET, {
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
      "JWT_GENERATION_FAILED",
      error instanceof Error ? error : new Error(String(error)),
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
      "JWT_VERIFICATION_FAILED",
      error instanceof Error ? error : new Error(String(error)),
    );
  }
};
