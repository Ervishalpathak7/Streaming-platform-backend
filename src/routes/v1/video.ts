import { Router } from "express";
import {
  completeUploadControllerV2,
  getMyVideosControllerV2,
  getSignedUrlControllerV2,
  initUploadControllerV2,
} from "@/controller/videoController";
import {
  getRouteLimiter,
  rateLimitMiddleware,
  uploadRouteLimiter,
} from "@/middlewares/ratelimiting";
import { asyncHandler } from "@/utils/asyncHandler";
import { authMiddleware } from "@/middlewares/auth.middleware";

const v1VideoRouter = Router();

v1VideoRouter.get(
  "/my",
  authMiddleware,
  rateLimitMiddleware(getRouteLimiter, "GET"),
  asyncHandler(getMyVideosControllerV2),
);

v1VideoRouter.post(
  "/init",
  authMiddleware,
  rateLimitMiddleware(uploadRouteLimiter, "UPLOAD"),
  asyncHandler(initUploadControllerV2),
);

v1VideoRouter.get(
  "/signedurl/:videoId",
  authMiddleware,
  rateLimitMiddleware(uploadRouteLimiter, "UPLOAD"),
  asyncHandler(getSignedUrlControllerV2),
);

v1VideoRouter.post(
  "/complete/:videoId",
  authMiddleware,
  rateLimitMiddleware(uploadRouteLimiter, "UPLOAD"),
  asyncHandler(completeUploadControllerV2),
);

export default v1VideoRouter;
