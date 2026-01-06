import multer from "multer";
import path from "path";
const storagePath = path.join(process.cwd(), "src/public");

const storage = multer.diskStorage({
  destination: function (_, _file, cb) {
    cb(null, `${storagePath}/`);
  },
  filename: (_, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random());
    cb(null, uniqueSuffix + file.originalname);
  },
});

export const upload = multer({ storage });
