import {
  ConflictError,
  InternalServerError,
  NotFoundError,
} from "@/error/index.js";
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
    throw new InternalServerError(
      "Failed to find user by id",
      error instanceof Error ? error : new Error(String(error)),
    );
  }
};

export const findUserByEmail = async (email: string) => {
  try {
    const user = await User.findOne({ email });
    if (!user) throw new NotFoundError("User not found");
    return user;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new InternalServerError(
      "Failed to find user by email",
      error instanceof Error ? error : new Error(String(error)),
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
    if (error instanceof MongoServerError)
      if (error.code === 11000) throw new ConflictError("Email already exists");
    throw new InternalServerError(
      "Failed to create user",
      error instanceof Error ? error : new Error(String(error)),
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
      error instanceof Error ? error : new Error(String(error)),
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
      error instanceof Error ? error : new Error(String(error)),
    );
  }
};
