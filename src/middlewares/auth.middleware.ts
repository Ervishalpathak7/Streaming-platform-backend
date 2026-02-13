import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "@/lib/jwt";
import { isTokenBlacklisted } from "@/services/auth.service";
import { InternalServerError, UnauthorizedError } from "@/error";
import logger from "@/lib/winston";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    throw new UnauthorizedError("Authorization header missing or malformed");

  const token = authHeader.split(" ")[1] || "";
  if (!token)
    throw new UnauthorizedError("Token missing from Authorization header");

  try {
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) throw new UnauthorizedError("Token is blacklisted");
    const decoded = verifyAccessToken(token);
    req.userId = decoded.userId;

    return next();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof InternalServerError)
      throw err;
    logger.error("Error in auth middleware", {
      token: token,
      req: {
        method: req.method,
        url: req.url,
        headers: req.headers,
      },
      error: err instanceof Error ? err.stack : String(err),
    });
    throw new InternalServerError(
      "An error occurred while processing the token",
      err instanceof Error ? err : new Error(String(err)),
    );
  }
};
