import bcrypt from "bcrypt";
import { AppError } from "../error/index.js";

export const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    throw new AppError("Error while hashing password", 500, error);
  }
};

export const comparePassword = async (password, hashPassword) => {
  try {
    return await bcrypt.compare(password, hashPassword);
  } catch (error) {
    throw new AppError("Error while comparing password", 500, error);
  }
};
