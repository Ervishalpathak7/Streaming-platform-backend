export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly meta: Record<string, unknown> | undefined;
  public readonly originalError: Error | undefined;

  constructor(
    message: string,
    statusCode: number,
    options?: {
      meta?: Record<string, unknown>;
      originalError?: Error;
      isOperational?: boolean;
    },
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = new.target.name;
    this.statusCode = statusCode;
    this.isOperational = options?.isOperational ?? true;
    this.meta = options?.meta;
    this.originalError = options?.originalError;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const normalizeError = (err: unknown): Error => {
  return err instanceof Error ? err : new Error(String(err));
};
