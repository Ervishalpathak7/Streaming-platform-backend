import { Router } from "express";
import {
  completeUploadControllerV1,
  getMyVideosControllerV1,
  initUploadControllerV1,
  getSignedUrlControllerV1,
} from "@/controller/v1/videoController.js";
import {
  getRouteLimiter,
  rateLimitMiddleware,
  uploadRouteLimiter,
} from "@/middlewares/ratelimiting.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import { authMiddleware } from "@/middlewares/auth.middleware.js";

const v1VideoRouter = Router();

v1VideoRouter.get(
  "/my",
  authMiddleware,
  rateLimitMiddleware(getRouteLimiter, "GET"),
  asyncHandler(getMyVideosControllerV1),
);

v1VideoRouter.post(
  "/init",
  authMiddleware,
  rateLimitMiddleware(uploadRouteLimiter, "UPLOAD"),
  asyncHandler(initUploadControllerV1),
);

v1VideoRouter.get(
  "/signedurl/:videoId",
  authMiddleware,
  rateLimitMiddleware(uploadRouteLimiter, "UPLOAD"),
  asyncHandler(getSignedUrlControllerV1),
);

v1VideoRouter.post(
  "/complete/:videoId",
  authMiddleware,
  rateLimitMiddleware(uploadRouteLimiter, "UPLOAD"),
  asyncHandler(completeUploadControllerV1),
);

export default v1VideoRouter;
