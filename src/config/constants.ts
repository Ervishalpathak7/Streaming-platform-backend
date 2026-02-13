/**
 * Application constants and configuration values
 * Centralized location for all hardcoded values
 */

export const AUTH_CONFIG = {
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || "30m",
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "7d",
  REFRESH_TOKEN_COOKIE_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
} as const;

export const RATE_LIMIT_CONFIG = {
  AUTH: {
    POINTS: parseInt(process.env.AUTH_RATE_LIMIT_POINTS || "10", 10),
    DURATION: parseInt(process.env.AUTH_RATE_LIMIT_DURATION || "900", 10), // 15 minutes
  },
  UPLOAD: {
    POINTS: parseInt(process.env.UPLOAD_RATE_LIMIT_POINTS || "10", 10),
    DURATION: parseInt(process.env.UPLOAD_RATE_LIMIT_DURATION || "60", 10), // 1 minute
  },
  GET: {
    POINTS: parseInt(process.env.GET_RATE_LIMIT_POINTS || "100", 10),
    DURATION: parseInt(process.env.GET_RATE_LIMIT_DURATION || "60", 10), // 1 minute
  },
} as const;

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
} as const;

export const VALIDATION_CONFIG = {
  IDEMPOTENCY_KEY_MAX_LENGTH: 255,
  IDEMPOTENCY_KEY_MIN_LENGTH: 1,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 20,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBER: true,
} as const;
