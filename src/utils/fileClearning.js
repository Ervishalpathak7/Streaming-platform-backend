import { logger } from "./winston.js";
import fs from "fs/promises";

export const fileClearing = async (filepath) => {
  if (!filepath) return;
  try {
    await fs.unlink(filepath);
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
