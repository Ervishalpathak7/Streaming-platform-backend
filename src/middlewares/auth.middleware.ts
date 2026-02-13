import { TRPCError } from "@trpc/server";
import { middleware } from "@/trpc/trpc.js";
import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "@/lib/jwt";

export const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Expired or invalid token",
    });
  }
  return next({
    ctx: {
      userId: ctx.userId,
    },
  });
});

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1] || "";
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decoded = verifyAccessToken(token);
    req.userId = decoded.userId;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
