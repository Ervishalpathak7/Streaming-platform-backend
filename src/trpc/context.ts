import { verifyAccessToken } from "@/lib/jwt.js";
import type { Request, Response } from "express";
import * as trpcExpress from "@trpc/server/adapters/express";

export async function createContext({
  req ,
  res
}: trpcExpress.CreateExpressContextOptions): Promise<{
  userId: string | null;
  ip: string | null;
  req: Request;
  res: Response;
}> {
  let userId: string | null = null;
  const ip: string | null =
    req.ip ||
    (Array.isArray(req.headers["x-forwarded-for"])
      ? req.headers["x-forwarded-for"][0]
      : req.headers["x-forwarded-for"]) ||
    req.socket.remoteAddress ||
    null;

  const authHeader = req.headers.authorization || undefined;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        if (typeof decoded === "object" && "userId" in decoded)
          userId = decoded.userId;
      } catch (error) {
        userId = null;
      }
    }
  }
  return {
    userId,
    ip,
    req,
    res,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
