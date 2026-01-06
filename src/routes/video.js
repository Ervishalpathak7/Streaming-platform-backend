import { Router } from "express";
import { upload } from "../middlewares/multer.js";

const fileRouter = Router();
fileRouter.use(
  "/upload",
  upload.single("photo"),
  (req, res) => {
    console.log(req.file);
    res.send("okayy")
  }
);
export default fileRouter;
