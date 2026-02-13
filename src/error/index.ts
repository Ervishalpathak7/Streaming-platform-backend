export class AppError extends Error {
  originalError: Error | null;
  errorMessage: string;
  meta: { [key: string]: any };
  constructor(
    name: string,
    message: string,
    originalError: Error | null = null,
    meta = {},
  ) {
    super(message);
    this.name = name;
    this.errorMessage = message;
    this.originalError = originalError;
    this.meta = meta;
  }
}

export class ValidationError extends AppError {
  constructor(field: string, message: string) {
    super("ValidationError", message, null, { field });
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super("NotFoundError", message);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string, originalError: Error | null = null) {
    super("InternalServerError", message, originalError);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super("UnauthorizedError", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super("ForbiddenError", message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("ConflictError", message);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string) {
    super("TooManyRequestsError", message);
  }
}

export class IdempotencyError extends AppError {
  constructor(message: string) {
    super("IdempotencyError", message);
  }
}

export class UploadFailedError extends AppError {
  constructor(message: string) {
    super("UploadFailedError", message);
  }
}

export class QueryLimitExceededError extends AppError {
  constructor(message: string) {
    super("QueryLimitExceededError", message);
  }
}

export class invalidQueryParameterError extends AppError {
  constructor(parameter: string, message: string) {
    super("InvalidQueryParameterError", message, null, { parameter });
  }
}