import logger from "@/lib/winston.js";
import type { Request, Response, NextFunction } from "express";


export const requestTimer = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    logger.info(`${req.method} ${req.originalUrl} → ${res.statusCode} | ${durationMs.toFixed(2)} ms`);
  });
  next();
};
