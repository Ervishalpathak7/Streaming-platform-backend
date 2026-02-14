import { FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { logger } from "../logger/logger";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const globalErrorHandler = (
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (error instanceof ZodError) {
    reply.status(StatusCodes.BAD_REQUEST).send({
      status: "error",
      message: "Validation failed",
      errors: error.flatten().fieldErrors,
    });
    return;
  }

  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      status: "error",
      message: error.message,
    });
    return;
  }

  // Handle Fastify Validation Errors (Legacy)
  if ((error as any).validation) {
    reply.status(StatusCodes.BAD_REQUEST).send({
      status: "error",
      message: "Validation failed",
      errors: (error as any).validation,
    });
    return;
  }

  logger.error(error, `❌ Unhandled Error on ${request.method} ${request.url}`);

  reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
    status: "error",
    message: "Internal Server Error",
  });
};
