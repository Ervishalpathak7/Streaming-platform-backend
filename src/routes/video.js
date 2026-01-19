import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import {
  createVideoController,
  getVideoControllerbyId,
  getMyVideos
} from "../controller/video.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware } from "../middlewares/auth.js";
import {
  rateLimitMiddleware,
} from "../middlewares/rateLimiting.js";

const videoRouter = Router();

videoRouter.post(
  "/",
  authMiddleware,
  rateLimitMiddleware("UPLOAD", (req) => req.userId || req.ip),
  upload.single("video"),
  asyncHandler(createVideoController),
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


export default videoRouter;
