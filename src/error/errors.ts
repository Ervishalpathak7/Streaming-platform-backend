import { AppError } from "./index.js";

export class ValidationError extends AppError {
  constructor(field: string, message: string) {
    super(message, 400, { meta: { field } });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal server error", originalError?: Error) {
    const options = originalError ? { originalError, isOperational: false } : { isOperational: false };
    super(message, 500, options);
  }
}
