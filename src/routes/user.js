import { Router } from "express";
import { loginController, logoutController, register } from "../controller/user.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rateLimitMiddleware } from "../middlewares/rateLimiting.js";
import { authMiddleware } from "../middlewares/auth.js";

const authRouter = Router();

authRouter.post(
  "/register",
  rateLimitMiddleware("AUTH", (req) => req.ip),
  asyncHandler(register),
);

authRouter.post(
  "/login",
  rateLimitMiddleware("AUTH", (req) => req.ip),
  asyncHandler(loginController),
);

authRouter.post("/logout", 
  rateLimitMiddleware("AUTH", (req) => req.ip), 
  authMiddleware, 
  asyncHandler(logoutController))

export default authRouter;
