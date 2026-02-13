import { UnauthorizedError } from "@/error/errors.js";
import { generateAccessToken } from "@/lib/jwt.js";
import {
  loginService,
  logoutService,
  refreshTokenService,
  registerService,
} from "@/services/auth.service.js";
import type { operations } from "@/types/api-types.js";
import type { Request, Response } from "express";

type RegisterBody =
  operations["registerUser"]["requestBody"]["content"]["application/json"];

type RegisterResponse =
  operations["registerUser"]["responses"]["201"]["content"]["application/json"];

type LoginBody =
  operations["loginUser"]["requestBody"]["content"]["application/json"];

type LoginResponse =
  operations["loginUser"]["responses"]["200"]["content"]["application/json"];

export const registerControllerV1 = async (req: Request, res: Response) => {
  const body = req.body as RegisterBody;
  const user = await registerService(body.name, body.email, body.password);
  const accessToken = await generateAccessToken(user.id.toString(), user.role);
  res.header("Authorization", accessToken);
  res.cookie("refreshToken", user.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return res.status(201).json({ status: "success" } as RegisterResponse);
};

export const loginControllerV1 = async (req: Request, res: Response) => {
  const body = req.body as LoginBody;
  const user = await loginService(body.email, body.password);
  const accessToken = await generateAccessToken(user.id.toString(), user.role);
  res.header("Authorization", accessToken);
  res.cookie("refreshToken", user.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return res.status(200).json({ status: "success" } as LoginResponse);
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
  return res.status(200).json({ status: "success" });
};

export const refreshTokenControllerV1 = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) throw new UnauthorizedError("Refresh token is required");
  const newAccessToken = await refreshTokenService(refreshToken);
  res.header("Authorization", newAccessToken);
  return res.status(200).json({ status: "success" });
};
