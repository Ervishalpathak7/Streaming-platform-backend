import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { uploadVideoController } from "../controller/video.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const fileRouter = Router();

fileRouter.use("/", upload.single("video"), asyncHandler(uploadVideoController));

export default fileRouter;
