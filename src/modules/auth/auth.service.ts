import { AppError } from "../../common/errors/error-handler";
import { StatusCodes } from "http-status-codes";
import { LoginInput, RegisterInput } from "./auth.schema";
import { createUser, findUserByEmail, findUserById } from "./auth.repository";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from "./auth.utils";

export async function registerUser(input: RegisterInput) {
  const existingUser = await findUserByEmail(input.email);
  if (existingUser) {
    throw new AppError("User already exists", StatusCodes.CONFLICT);
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({ ...input, passwordHash });
  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = signRefreshToken({ id: user.id, version: 1 }); // Simple versioning

  return { user, accessToken, refreshToken };
}

export async function loginUser(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED);
  }

  const isValid = await verifyPassword(user.password, input.password);
  if (!isValid) {
    throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED);
  }

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = signRefreshToken({ id: user.id, version: 1 }); // Simple versioning

  return { user, accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const decoded = verifyToken(refreshToken) as any;
    const user = await findUserById(decoded.id);

    if (!user) {
      throw new AppError("User not found", StatusCodes.UNAUTHORIZED);
    }

    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken };
  } catch (error) {
    throw new AppError("Invalid refresh token", StatusCodes.UNAUTHORIZED);
  }
}
