import app from "./app.js";
import { connectDb } from "./database/index.js";
import { gracefullShutdown } from "./utils/shutdown.js";
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "";
export let server;
import { v2 } from "cloudinary";
import { logger } from "./utils/winston.js";

v2.config({
  secure: true,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
});

connectDb(MONGO_URI)
  .then(() => {
    server = app.listen(PORT, () => {
      logger.info(`Server Started Running http://localhost:${PORT}/`);
    });
  })
  .catch((err) => {
    logger.error("Error while starting server", {
      message: err.message,
      stack: err.stack,
    });
    gracefullShutdown();
  });

process.on("SIGINT", gracefullShutdown);
