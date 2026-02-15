import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(["USER", "ADMIN"]),
  videos: z.array(z.string()).optional(),
});

export const loginResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
});

export const registerResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const refreshTokenResponseSchema = z.object({
  accessToken: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
