import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import {
  getVideoController,
  createVideoController,
} from "../controller/video.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware } from "../middlewares/auth.js";
import {
  getRouteLimiter,
  rateLimitMiddleware,
  uploadRouteLimiter,
} from "../middlewares/rateLimiting.js";

const videoRouter = Router();

videoRouter.get(
  "/:id",
  authMiddleware,
  rateLimitMiddleware(getRouteLimiter, (req) => req.ip),
  asyncHandler(getVideoController)
);

videoRouter.post(
  "/",
  authMiddleware,
  rateLimitMiddleware(uploadRouteLimiter, (req) => req.userId || req.ip),
  upload.single("video"),
  asyncHandler(createVideoController)
);

export default videoRouter;
