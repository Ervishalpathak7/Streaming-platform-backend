import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import {
  getVideoController,
  createVideoController,
} from "../controller/video.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware } from "../middlewares/auth.js";

const fileRouter = Router();

fileRouter.use("/:id", authMiddleware, asyncHandler(getVideoController));
fileRouter.use(
  "/",
  authMiddleware,
  upload.single("video"),
  asyncHandler(createVideoController)
);

export default fileRouter;
