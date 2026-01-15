import fs from "fs";
import { logger } from "./winston.js";

export const fileClearing = async (filepath) => {
  if (!filepath) return;
  try {
    fs.unlink(filepath);
  } catch (err) {
    logger.error("Temp file cleanup failed", {
      filepath,
      message: err.message,
      stack: err.stack,
    });
  }
};
