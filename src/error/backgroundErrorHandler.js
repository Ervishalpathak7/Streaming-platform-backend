import { logger } from "../utils/winston.js";

export const handleBackgroundError = (
  error,
  type = "UNEXPECTED",
  context = "No Context Set"
) => {
  console.log(error);
  logger.error(`Error while ${type} : ${error?.message} : ${context}`, {
    stack: error?.stack,
  });
};
