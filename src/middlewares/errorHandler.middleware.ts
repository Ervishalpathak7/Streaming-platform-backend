import { InternalServerError } from "@/error/errors.js";
import { AppError } from "@/error/index.js";
import { isOpenApiValidatorError } from "@/error/openApiErrorValidator.js";
import logger from "@/lib/winston.js";
import type { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Handle OpenAPI validator errors
  if (isOpenApiValidatorError(err)) {
    logger.warn("OpenAPI validation error:", {
      path: req.path,
      method: req.method,
      errors: err.errors,
    });

    const validationErrors = err.errors.map((e) => ({
      field: e.path?.replace("/body/", "") || "unknown",
      message: e.message,
    }));

    return res.status(err.status || 422).json({
      status: "error",
      message: "Validation failed",
      errors: validationErrors,
    });
  }

  if (err instanceof InternalServerError) {
    logger.error("Internal Server Error:", {
      error: err,
      path: req.path,
      method: req.method,
      originalError: err.originalError,
    });
    return res.status(500).json({
      status: "error",
      message:
        process.env.NODE_ENV === "production"
          ? "Internal Server Error"
          : err.message,
    });
  }

  if (err instanceof AppError) {
    logger.warn("Application error:", {
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
      method: req.method,
      meta: err.meta,
    });

    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      meta: err.meta ?? null,
    });
  }

  logger.error("Unhandled error:", {
    error: err instanceof Error ? err.stack : String(err),
    path: req.path,
    method: req.method,
  });
  return res.status(500).json({
    status: "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err instanceof Error
          ? err.message
          : "An unexpected error occurred",
  });
};
