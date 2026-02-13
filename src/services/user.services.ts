import {
  ConflictError,
  InternalServerError,
  NotFoundError,
} from "@/error/errors.js";
import { normalizeError } from "@/error/index.js";
import logger from "@/lib/winston.js";
import User from "@/models/user.model.js";
import type { User as UserType } from "@/models/user.model.js";
import { MongoServerError } from "mongodb";

export const findUserById = async (id: string) => {
  try {
    const user = await User.findById(id).select(
      "-password -updatedAt -createdAt",
    );
    if (!user) throw new NotFoundError("User not found");
    return user;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error("Error in findUserById:", {
      id,
      error: normalizeError(error),
    });
    throw new InternalServerError(
      "Failed to find user by id",
      normalizeError(error),
    );
  }
};

export const findUserByEmail = async (email: string) => {
  try {
    const user = await User.findOne({ email }).select("email password");
    if (!user) throw new NotFoundError("User not found");
    return user;
  } catch (error) {
    logger.error("Error in findUserByEmail:", {
      email,
      error: normalizeError(error),
    });
    if (error instanceof NotFoundError) throw error;
    throw new InternalServerError(
      "Failed to find user by email",
      normalizeError(error),
    );
  }
};

export const createUser = async (user: UserType) => {
  try {
    const newUser = await User.create({
      name: user.name,
      email: user.email,
      password: user.password,
    });
    return newUser;
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000)
      throw new ConflictError("Email already exists");
    logger.error("Error in createUser:", {
      user,
      error: normalizeError(error),
    });
    throw new InternalServerError(
      "Failed to create user",
      normalizeError(error),
    );
  }
};

export const updateUser = async (id: string, user: Partial<UserType>) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(id, user, {
      new: true,
    }).select("-password -updatedAt -createdAt");
    if (!updatedUser) throw new NotFoundError("User not found");
    return updatedUser;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new InternalServerError(
      "Failed to update user",
      normalizeError(error),
    );
  }
};

export const deleteUser = async (id: string) => {
  try {
    const deletedUser = await User.findByIdAndDelete(id).select(
      "-password -updatedAt -createdAt",
    );
    if (!deletedUser) throw new NotFoundError("User not found");
    return deletedUser;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new InternalServerError(
      "Failed to delete user",
      normalizeError(error),
    );
  }
};
