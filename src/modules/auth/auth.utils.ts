import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { config } from "../../common/config/config";

export async function hashPassword(password: string) {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, plain: string) {
  return argon2.verify(hash, plain);
}

export function signAccessToken(payload: Record<string, any>) {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as any,
  });
}

export function signRefreshToken(payload: Record<string, any>) {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.REFRESH_TOKEN_EXPIRES_IN as any,
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, config.JWT_SECRET);
}
