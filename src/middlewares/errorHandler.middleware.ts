import type { Request, Response, NextFunction } from "express";
import { TRPCError } from "@trpc/server";
import { isOpenApiValidatorError } from "@/error/openApiErrorValidator.js";
import {
  openApiErrorHandler,
  trpcErrorHandler,
} from "@/error/backgroundErrorHandler.js";
import logger from "@/lib/winston.js";

export const errorHandler = (
  err: any,
  _: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof TRPCError) {
    const { status, error } = trpcErrorHandler(err);
    res.status(status).json({ error });
    logger.error("tRPC Error:", {
      message: err.message,
      code: err.code,
      stack: err.stack,
    });
    return;
  } else if (isOpenApiValidatorError(err)) {
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
