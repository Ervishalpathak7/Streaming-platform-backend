import jwt from "jsonwebtoken";
import { AppError } from "../error/index.js";

export const generateAccessToken = async (userId) => {
  try {
    return jwt.sign({ userId: userId }, process.env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "30MINUTES",
    });
  } catch (error) {
    logger.warn("JWT token generation failed", {
      category: "user",
      service: "jwt",
      lifecycle: "request",
      code: "JWT_GENERATION_FAILED",
      err,
    });
    throw new AppError("Token Generation failed", 500, error);
  }
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch (error) {
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      throw new AppError("Invalid or expired token", 401);
    }
    logger.warn("JWT token verification failed", {
      category: "user",
      service: "jwt",
      lifecycle: "request",
      code: "JWT_VERIFICATION_FAILED",
      err,
    });
    throw new AppError("Token verification failed", 500, error);
  }
};
