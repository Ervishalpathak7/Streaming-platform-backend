import { Router } from "express";

const v1AuthRouter = Router();

import {
  loginControllerV1,
  logoutControllerV1,
  refreshTokenControllerV1,
  registerControllerV1,
} from "@/controller/v1/auth.controller.js";
import { authMiddleware } from "@/middlewares/auth.middleware.js";
import {
  authRouteLimiter,
  rateLimitMiddleware,
} from "@/middlewares/ratelimiting.js";
import { asyncHandler } from "@/utils/asyncHandler.js";

v1AuthRouter.post(
  "/register",
  rateLimitMiddleware(authRouteLimiter, "AUTH"),
  asyncHandler(registerControllerV1),
);
v1AuthRouter.post(
  "/login",
  rateLimitMiddleware(authRouteLimiter, "AUTH"),
  asyncHandler(loginControllerV1),
);
v1AuthRouter.post(
  "/logout",
  rateLimitMiddleware(authRouteLimiter, "AUTH"),
  asyncHandler(logoutControllerV1),
);
v1AuthRouter.post(
  "/refresh-token",
  authMiddleware,
  rateLimitMiddleware(authRouteLimiter, "AUTH"),
  asyncHandler(refreshTokenControllerV1),
);

export default v1AuthRouter;
