import { Types } from "mongoose";
import {
  ValidationError,
  InvalidQueryParameterError,
} from "@/error/errors.js";
import { VALIDATION_CONFIG, PAGINATION_CONFIG } from "@/config/constants.js";

/**
 * Validates if a string is a valid MongoDB ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id) && new Types.ObjectId(id).toString() === id;
};

/**
 * Validates MongoDB ObjectId and throws if invalid
 */
export const validateObjectId = (id: string, fieldName = "id"): void => {
  if (!isValidObjectId(id)) {
    throw new ValidationError(fieldName, `Invalid ${fieldName} format`);
  }
};

/**
 * Validates pagination parameters
 */
export const validatePagination = (
  page: number | string | undefined,
  limit: number | string | undefined,
): { page: number; limit: number } => {
  const pageNum =
    typeof page === "string" ? parseInt(page, 10) : page || PAGINATION_CONFIG.DEFAULT_PAGE;
  const limitNum =
    typeof limit === "string"
      ? parseInt(limit, 10)
      : limit || PAGINATION_CONFIG.DEFAULT_LIMIT;

  if (isNaN(pageNum) || pageNum < 1) {
    throw new InvalidQueryParameterError(
      "page",
      "Page must be a positive integer",
    );
  }

  if (isNaN(limitNum) || limitNum < 1) {
    throw new InvalidQueryParameterError(
      "limit",
      "Limit must be a positive integer",
    );
  }

  if (limitNum > PAGINATION_CONFIG.MAX_LIMIT) {
    throw new InvalidQueryParameterError(
      "limit",
      `Limit cannot exceed ${PAGINATION_CONFIG.MAX_LIMIT}`,
    );
  }

  return { page: pageNum, limit: limitNum };
};

/**
 * Validates idempotency key format and length
 */
export const validateIdempotencyKey = (key: string): void => {
  if (!key || typeof key !== "string") {
    throw new ValidationError(
      "Idempotency-Key",
      "Idempotency-Key header is required",
    );
  }

  if (
    key.length < VALIDATION_CONFIG.IDEMPOTENCY_KEY_MIN_LENGTH ||
    key.length > VALIDATION_CONFIG.IDEMPOTENCY_KEY_MAX_LENGTH
  ) {
    throw new ValidationError(
      "Idempotency-Key",
      `Idempotency-Key must be between ${VALIDATION_CONFIG.IDEMPOTENCY_KEY_MIN_LENGTH} and ${VALIDATION_CONFIG.IDEMPOTENCY_KEY_MAX_LENGTH} characters`,
    );
  }
};

/**
 * Validates password strength
 */
export const validatePasswordStrength = (password: string): void => {
  if (password.length < VALIDATION_CONFIG.PASSWORD_MIN_LENGTH) {
    throw new ValidationError(
      "password",
      `Password must be at least ${VALIDATION_CONFIG.PASSWORD_MIN_LENGTH} characters long`,
    );
  }

  if (password.length > VALIDATION_CONFIG.PASSWORD_MAX_LENGTH) {
    throw new ValidationError(
      "password",
      `Password must be less than ${VALIDATION_CONFIG.PASSWORD_MAX_LENGTH} characters`,
    );
  }

  if (VALIDATION_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    throw new ValidationError(
      "password",
      "Password must contain at least one uppercase letter",
    );
  }

  if (VALIDATION_CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    throw new ValidationError(
      "password",
      "Password must contain at least one lowercase letter",
    );
  }

  if (VALIDATION_CONFIG.PASSWORD_REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    throw new ValidationError(
      "password",
      "Password must contain at least one number",
    );
  }
};

/**
 * Sanitizes string input to prevent injection attacks
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== "string") {
    return "";
  }
  // Remove null bytes and trim whitespace
  return input.replace(/\0/g, "").trim();
};

/**
 * Sanitizes object inputs recursively
 */
export const sanitizeInput = <T>(input: T): T => {
  if (typeof input === "string") {
    return sanitizeString(input) as T;
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput) as T;
  }
  if (input && typeof input === "object") {
    const sanitized = {} as T;
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        sanitized[key] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  return input;
};
