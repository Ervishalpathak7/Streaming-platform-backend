import type { AppError } from "@/error/index.js";
import logger from "@/lib/winston.js";
import type { Request, Response, NextFunction } from "express";

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
  });

  if (error.statusCode >= 500) {
    logger.error("App Error: ", {
      message: error.message,
      stack: error.stack,
    });
  } else {
    logger.warn("User Error: ", {
      message: error.message,
      stack: error.stack,
    });
  }
};
