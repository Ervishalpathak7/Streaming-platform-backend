import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { getVideoController, uploadVideoController } from "../controller/video.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const fileRouter = Router();

fileRouter.use("/", upload.single("video"), asyncHandler(uploadVideoController));
fileRouter.use("/:id", asyncHandler(getVideoController));


export default fileRouter;
