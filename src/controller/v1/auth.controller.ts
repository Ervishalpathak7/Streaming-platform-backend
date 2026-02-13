import type { Request, Response } from "express";
import { generateAccessToken } from "@/lib/jwt.js";
import { UnauthorizedError } from "@/error/errors.js";
import type { components } from "@/types/api-types.js";
import {
  loginService,
  logoutService,
  refreshTokenService,
  registerService,
} from "@/services/auth.service.js";
import { sanitizeInput, validatePasswordStrength } from "@/utils/validation.js";
import { AUTH_CONFIG } from "@/config/constants.js";

type LoginRequest = components["schemas"]["LoginRequest"];
type RegisterRequest = components["schemas"]["RegisterRequest"];
type LoginBody = LoginRequest;
type RegisterBody = RegisterRequest;

/**
 * Sets refresh token cookie with consistent options
 */
const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: AUTH_CONFIG.REFRESH_TOKEN_COOKIE_MAX_AGE,
  });
};

export const registerControllerV1 = async (req: Request, res: Response) => {
  const body = sanitizeInput(req.body) as RegisterBody;
  // Validate password strength
  validatePasswordStrength(body.password);
  const user = await registerService(body.name, body.email, body.password);
  const accessToken = await generateAccessToken(user.id.toString(), user.role);
  res.header("Authorization", accessToken);
  setRefreshTokenCookie(res, user.refreshToken);
  return res
    .status(201)
    .json({
      status: "success",
      message: "User registered successfully",
    });
};

export const loginControllerV1 = async (req: Request, res: Response) => {
  const body = sanitizeInput(req.body) as LoginBody;
  const user = await loginService(body.email, body.password);
  const accessToken = await generateAccessToken(user.id.toString(), user.role);
  res.header("Authorization", accessToken);
  setRefreshTokenCookie(res, user.refreshToken);
  return res.status(200).json({ status: "success", message: "Login successful" });
};

export const logoutControllerV1 = async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization?.split(" ")[1];
  const refreshToken = req.cookies.refreshToken;
  if (!accessToken || !refreshToken) {
    return res
      .status(400)
      .json({ status: "error", message: "Tokens are required" });
  }
  await logoutService(accessToken as string, refreshToken);
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.status(200).json({ status: "success" , message: "Logged out successfully" });
};

export const refreshTokenControllerV1 = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) throw new UnauthorizedError("Refresh token is required");
  const newAccessToken = await refreshTokenService(refreshToken);
  res.header("Authorization", newAccessToken);
  return res.status(200).json({ status: "success" , message : "Token refreshed successfully" });
};
