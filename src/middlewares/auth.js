import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../error/index.js";

export const authMiddleware = (req, res, next) => {
  const authHeader = req?.headers?.authorization || null;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("No access token", 401);
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyAccessToken(token);
  req.userId = payload.userId;
  next();
};
