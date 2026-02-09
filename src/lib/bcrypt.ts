import bcrypt from "bcrypt";
import { AppError } from "@/error/index.js";
import logger from "@/lib/winston.js";

export const hashPassword = async (password: string) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error: unknown) {
    logger.error("Password generation threw an error", {
      category: "server",
      service: "bcrypt",
      lifecycle: "request",
      code: "PASSWORD_GENERATION_ERROR",
      error: error,
    });

    throw new AppError(
      "Password hashing failed",
      "PASSWORD_GENERATION_ERROR",
      error instanceof Error
        ? error
        : new Error(String(error) || "Unknown error during password hashing"),
    );
  }
};

export const comparePassword = async (
  password: string,
  hashPassword: string,
) => {
  try {
    return await bcrypt.compare(password, hashPassword);
  } catch (error: unknown) {
    logger.error("Password comparison threw an error", {
      category: "server",
      service: "bcrypt",
      lifecycle: "request",
      code: "PASSWORD_COMPARISON_ERROR",
      error: error,
    });

    throw new AppError(
      "Password comparison failed",
      "PASSWORD_COMPARISON_ERROR",
      error instanceof Error
        ? error
        : new Error(
            String(error) || "Unknown error during password comparison",
          ),
    );
  }
};
