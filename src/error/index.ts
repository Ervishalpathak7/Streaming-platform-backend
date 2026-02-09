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
