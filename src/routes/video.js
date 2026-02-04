import { Router } from "express";
import {
  getVideoControllerbyId,
  getMyVideos,
  initUploadController,
  getUploadStatusController,
} from "../controller/video.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware } from "../middlewares/auth.js";
import {
  rateLimitMiddleware,
} from "../middlewares/rateLimiting.js";

const videoRouter = Router();

videoRouter.post(
  "/init",
  authMiddleware,
  rateLimitMiddleware("UPLOAD", (req) => req.userId || req.ip),
  asyncHandler(initUploadController),
);

videoRouter.get(
  "/my",
  authMiddleware,
  rateLimitMiddleware("GET", (req) => req.ip),
  asyncHandler(getMyVideos),
);

videoRouter.get(
  "/:id",
  authMiddleware,
  rateLimitMiddleware("GET", (req) => req.ip),
  asyncHandler(getVideoControllerbyId),
);

videoRouter.get(
  "/status/:uploadId",
  authMiddleware,
  rateLimitMiddleware("GET", (req) => req.userId || req.ip),
  asyncHandler(getUploadStatusController),
);


export default videoRouter;
