import jwt from "jsonwebtoken";
import { AppError } from "../error/index.js";

export const generateAccessToken = async (userId) => {
  try {
    return jwt.sign({ userId: userId }, process.env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "30MINUTES",
    });
  } catch (error) {
    throw new AppError("Token Generation failed", 500, error);
  }
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      // expected auth failure
      throw new AppError("Invalid or expired token", 401);
    }
    // truly unexpected
    throw new AppError("Token verification failed", 500, error);
  }
};
