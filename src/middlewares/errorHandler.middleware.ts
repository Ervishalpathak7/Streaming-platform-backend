import type { Request, Response, NextFunction } from "express";
import { isOpenApiValidatorError } from "@/error/openApiErrorValidator.js";
import { openApiErrorHandler } from "@/error/backgroundErrorHandler.js";
import logger from "@/lib/winston.js";

export const errorHandler = (
  err: any,
  _: Request,
  res: Response,
  next: NextFunction,
) => {
  if (isOpenApiValidatorError(err)) {
    const { status, errors } = openApiErrorHandler(err);
    res.status(status).json({ errors });
    logger.error("OpenAPI Validation Error:", {
      status: err.status,
      message: err.message,
      errors: err.errors,
    });
    return;
  }
  res.status(500).json({ error: "An unknown error occurred" });
  logger.error("Unknown Error:", {
    message: err.message,
    stack: err.stack,
    error: err,
  });
  return;
};
