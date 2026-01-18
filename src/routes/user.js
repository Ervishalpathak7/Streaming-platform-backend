import { Router } from "express";
import { loginController, register } from "../controller/user.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rateLimitMiddleware } from "../middlewares/rateLimiting.js";

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

export default authRouter;
