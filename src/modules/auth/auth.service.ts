import { AppError } from "../../common/errors/error-handler";
import { StatusCodes } from "http-status-codes";
import { LoginInput, RegisterInput } from "./auth.schema";
import { createUser, findUserByEmail, findUserById } from "./auth.repository";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./auth.utils";
import {
  storeRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
} from "./refresh-token.repository";

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
  const refreshToken = signRefreshToken({ id: user.id, version: Date.now() });

  // Store refresh token in database
  await storeRefreshToken(user.id, refreshToken, 7 * 24 * 60 * 60 * 1000); // 7 days
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
  const refreshToken = signRefreshToken({ id: user.id, version: Date.now() });

  // Store refresh token in database
  await storeRefreshToken(user.id, refreshToken, 7 * 24 * 60 * 60 * 1000);

  return { user, accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const decoded = verifyRefreshToken(refreshToken) as any;

    // Check if token exists and is not revoked
    const storedToken = await findRefreshToken(refreshToken);
    if (!storedToken || storedToken.revoked) {
      throw new AppError("Refresh token revoked", StatusCodes.UNAUTHORIZED);
    }

    if (storedToken.expiresAt < new Date()) {
      throw new AppError("Refresh token expired", StatusCodes.UNAUTHORIZED);
    }

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

export async function logoutUser(refreshToken: string) {
  await revokeRefreshToken(refreshToken);
}

export async function me(userId: string) {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }
  return user;
}
