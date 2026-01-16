import bcrypt from "bcrypt";
import { AppError } from "../error/index.js";

export const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    logger.error("Password generation threw an error", {
      category: "server",
      service: "bcrypt",
      lifecycle: "request",
      code: "PASSWORD_GENERATION_ERROR",
      err,
    });

    throw new AppError("Internal Server Error", 500, error);
  }
};

export const comparePassword = async (password, hashPassword) => {
  try {
    return await bcrypt.compare(password, hashPassword);
  } catch (error) {
    logger.error("Password comparison threw an error", {
      category: "server",
      service: "bcrypt",
      lifecycle: "request",
      code: "PASSWORD_COMPARISON_ERROR",
      err,
    });

    throw new AppError("Internal Server Error", 500, error);
  }
};
