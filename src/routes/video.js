import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { uploadVideoController } from "../controller/video.js";

const fileRouter = Router();

fileRouter.use("/upload", upload.single("photo"), uploadVideoController);

export default fileRouter;
