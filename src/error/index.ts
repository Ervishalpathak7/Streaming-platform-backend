export class AppError extends Error {
  originalError: Error | null;
  errorMessage: string;
  constructor(
    message: string,
    name: string,
    originalError: Error | null = null,
  ) {
    super(message);
    this.name = name;
    this.errorMessage = message;
    this.originalError = originalError;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "ValidationError");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, "NotFoundError");
  }
}

export class InternalServerError extends AppError {
  constructor(message: string , originalError: Error | null = null) {
    super(message, "InternalServerError", originalError);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, "UnauthorizedError");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, "ForbiddenError");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "ConflictError");
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string) {
    super(message, "TooManyRequestsError");
  }
}
