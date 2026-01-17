import { logger } from "./winston.js";
export const requestTimer = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    logger.info(
      `${req.method} ${req.originalUrl} → ${res.statusCode} | ${durationMs.toFixed(2)} ms`
    );
  });

  next();
};
