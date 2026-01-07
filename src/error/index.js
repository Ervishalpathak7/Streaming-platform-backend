export class AppError extends Error {
  constructor(message, statusCode, originalError = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorMessage = message;
    this.isOperational = true;
    this.originalError = originalError;
  }
}
