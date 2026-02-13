import bcrypt from "bcrypt";
import { normalizeError } from "@/error/index.js";
import logger from "@/lib/winston.js";
import { InternalServerError } from "@/error/errors.js";

export const hashPassword = async (password: string) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error: unknown) {
    logger.error("Password generation threw an error", {
      category: "server",
      service: "bcrypt",
      lifecycle: "request",
      code: "PASSWORD_HASHING_FAILED",
      error: normalizeError(error),
    });

    throw new InternalServerError(
      "PASSWORD_HASHING_FAILED",
      normalizeError(error),
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
      code: "PASSWORD_COMPARISON_FAILED",
      error: normalizeError(error),
    });

    throw new InternalServerError(
      "PASSWORD_COMPARISON_FAILED",
      normalizeError(error),
    );
  }
};
