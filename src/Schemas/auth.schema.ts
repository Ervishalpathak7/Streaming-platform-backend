import z from "zod";

export const loginReqSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .max(20, "Password must be less than 20 characters long"),
});

export const loginResSchema = z.object({
  message: z.string(),
  status: z.enum(["success"]).default("success"),
  token: z.string().optional(),
});

export const registerReqSchema = z.object({
  name: z
    .string("Name is required")
    .min(2, "Name must be at least 2 characters long")
    .max(50, "Name must be less than 50 characters long"),
  email: z.email("Invalid email address"),
  password: z
    .string("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .max(20, "Password must be less than 20 characters long"),
});

export const registerResSchema = z.object({
  message: z.string(),
  token: z.string(),
  status: z.enum(["success"]).default("success"),
});