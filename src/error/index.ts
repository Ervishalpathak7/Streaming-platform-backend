export class AppError extends Error {
  originalError: Error | null;
  statusCode: number;
  errorMessage: string;
  isOperational: boolean;
  constructor(
    message: string,
    statusCode: number,
    originalError: Error | null = null,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorMessage = message;
    this.isOperational = true;
    this.originalError = originalError;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, originalError: Error | null = null) {
    super(message, 400, originalError);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, originalError: Error | null = null) {
    super(message, 404, originalError);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string, originalError: Error | null = null) {
    super(message, 500, originalError);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, originalError: Error | null = null) {
    super(message, 401, originalError);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, originalError: Error | null = null) {
    super(message, 403, originalError);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, originalError: Error | null = null) {
    super(message, 409, originalError);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, originalError: Error | null = null) {
    super(message, 400, originalError);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string, originalError: Error | null = null) {
    super(message, 503, originalError);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string, originalError: Error | null = null) {
    super(message, 429, originalError);
  }
}
