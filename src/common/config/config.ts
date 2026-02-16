import { z } from "zod";
import dotenv from "dotenv";
import { logger } from "@common/logger/logger";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  FRONTEND_URL: z.string().url(),
  DATABASE_URL: z.string(),
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_BUCKET_NAME: z.string(),
  AWS_ENDPOINT: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  logger.error("Invalid environment variables:", parsedEnv.error.issues);
  process.exit(1);
}

export const config = parsedEnv.data;
