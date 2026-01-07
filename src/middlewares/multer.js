import multer from "multer";
import path from "path";
import { AppError } from "../error/index.js";

const storagePath = path.join(process.cwd(), "src/public");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storagePath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "video/mp4",
    "video/quicktime", // .mov
    "video/x-matroska", // .mkv
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(new AppError("Only video files are allowed", 400), false);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024, 
  },
});
