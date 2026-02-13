import jwt from "jsonwebtoken";
import { InternalServerError, UnauthorizedError } from "@/error/errors.js";
import logger from "@/lib/winston.js";
import { normalizeError } from "@/error/index.js";

const JWT_SECRET = process.env.JWT_SECRET;

type JwtPayload = {
  userId: string;
  role: string;
  iat: number;
  exp: number;
};

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export const generateAccessToken = async (userId: string, role: string) => {
  try {
    const payload = { userId, role };
    return jwt.sign(payload, JWT_SECRET, {
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
    throw new InternalServerError(
      "JWT_GENERATION_FAILED",
      normalizeError(error),
    );
  }
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as JwtPayload;
  } catch (error) {
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    )
      throw new UnauthorizedError("Invalid or expired token");

    throw new InternalServerError(
      "JWT_VERIFICATION_FAILED",
      normalizeError(error),
    );
  }
};

export const generateRefreshToken = async (userId: string, role: string) => {
  try {
    const payload = { userId, role };
    return jwt.sign(payload, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "7DAYS",
    });
  } catch (error) {
    logger.warn("JWT refresh token generation failed", {
      category: "user",
      service: "jwt",
      lifecycle: "request",
      code: "JWT_REFRESH_GENERATION_FAILED",
      error,
    });
    throw new InternalServerError(
      "JWT_REFRESH_GENERATION_FAILED",
      normalizeError(error),
    );
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as JwtPayload;
  } catch (error) {
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    )
      throw new UnauthorizedError("Invalid or expired refresh token");

    logger.error("JWT refresh token verification failed", {
      category: "user",
      service: "jwt",
      lifecycle: "request",
      code: "JWT_REFRESH_VERIFICATION_FAILED",
      error : normalizeError(error),
    });

    throw new InternalServerError(
      "JWT_REFRESH_VERIFICATION_FAILED",
      normalizeError(error),
    );
  }
};
