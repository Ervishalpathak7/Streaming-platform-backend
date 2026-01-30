import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../error/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getRedis } from "../cache/index.js";

export const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req?.headers?.authorization || null;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("No access token", 401);
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyAccessToken(token);
  const redisClient = getRedis();
  const isBlacklisted = await redisClient.get(`bl:Bearer ${token}`);
  if (isBlacklisted) {
    return next(new AppError("Token no longer valid", 401));
  }

  req.userId = payload.userId;
  req.exp = payload.exp;
  next();
});
