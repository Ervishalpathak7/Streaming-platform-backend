import { logger } from "../utils/winston.js";

export const handleBackgroundError = (
  error,
  context = {},
  type = "UNEXPECTED"
) => {
  logger.error(`Error while ${type} : ${error?.message}`, {
    stack: error?.stack,
  });
};
