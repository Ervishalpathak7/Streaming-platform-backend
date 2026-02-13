import { InternalServerError } from "@/error/errors.js";
import { AppError } from "@/error/index.js";
import logger from "@/lib/winston.js";
import type { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof InternalServerError) {
    logger.error("Internal Server Error:", {
      error: err,
    });
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      meta: err.meta ?? null,
    });
  }

  logger.error("Unhandled error:", {
    error: err instanceof Error ? err.stack : String(err),
  });
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};
