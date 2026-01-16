import { logger } from "../utils/winston.js";

export const errorHandler = (error, req, res, next) => {
  res.status(error.statusCode || 500).json({
    success: false,
    message: error?.errorMessage || "Internal server error",
  });
  logger.error("User Error :", {
    message: error?.errorMessage || error?.message,
  });
};
