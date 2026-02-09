import logger from "@/lib/winston.js";

export const handleBackgroundError = (
  error: Error,
  type = "UNEXPECTED",
  context = "No Context Set",
) => {
  logger.error(`Error while ${type} : ${error.message} : ${context}`, {
    stack: error.stack,
  });
};
