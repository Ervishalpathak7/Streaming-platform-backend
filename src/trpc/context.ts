import { UnauthorizedError } from "@/error/index.js";
import { verifyAccessToken } from "@/lib/jwt.js";
import type { Request } from "express";

export async function createContext({ req }: { req: Request }) {
  const authHeader = req.headers.authorization || undefined;
  let userId: string | null = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        if (typeof decoded === "object" && "userId" in decoded) {
          userId = decoded.userId;
        }
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          throw error;
        }
        if (error instanceof Error) {
          throw new Error(`Error verifying access token: ${error.message}`);
        }
      }
    }
  }
  return {
    userId,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
