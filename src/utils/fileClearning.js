import fs from "fs";
import { logger } from "./winston.js";

export const fileClearing = async (filepath) => {
  fs.unlink(filepath, (err) => {
    if (err) logger.error("Error while clearning file");
  });
};
