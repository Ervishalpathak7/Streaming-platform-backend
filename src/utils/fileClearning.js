import fs from "fs";
import { logger } from "./winston.js";

export const fileClearing = async (filepath) => {
  if (!filepath) return;
  try {
    fs.unlink(filepath);
  } catch (err) {
    logger.warn("File cleanup failed", {
      category: "server",
      service: "app",
      lifecycle: "process",
      code: "FILE_CLEANUP_FAILED",
      filepath,
      err,
    });
  }
};
