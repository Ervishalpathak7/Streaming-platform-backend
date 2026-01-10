import { logger } from "../utils/winston.js";

export const errorHandler = (err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err?.errorMessage || "Internal server error",
  });
  logger.error("User Error :", {
    message: err?.errorMessage || err?.message || "Unexpected Error",
  });
};
