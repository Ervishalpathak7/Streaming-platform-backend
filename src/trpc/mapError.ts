// trpc/mapError.ts
import {
  AppError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
  ValidationError,
} from "@/error/index.js";
import logger from "@/lib/winston.js";
import { TRPCError } from "@trpc/server";

export function mapToTRPCError(err: unknown): never {
  if (err instanceof UnauthorizedError)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: err.message,
    });

  if (err instanceof ConflictError)
    throw new TRPCError({
      code: "CONFLICT",
      message: err.message,
    });

  if (err instanceof ValidationError)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: err.message,
    });

  if (err instanceof NotFoundError)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: err.message,
    });

  if (err instanceof InternalServerError)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    });

  if (err instanceof ForbiddenError)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: err.message,
    });

  if (err instanceof TooManyRequestsError)
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: err.message,
    });

  if (err instanceof AppError) {
    logger.error("Application error: ", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    });
  }

  if (err instanceof Error) {
    logger.error("Unexpected error: ", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    });
  }

  throw err;
}
