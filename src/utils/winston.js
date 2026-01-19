import { createLogger, format, transports } from "winston";
const { combine, colorize, errors, json, printf } = format;

const istTimestamp = () =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());

export const devFormat = printf(({ level, message, ...meta }) => {
  return `${istTimestamp()} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""}`
});

export const logger = createLogger({
  level: "info",
  format: combine(errors({ stack: true }), json()),
  transports: [
    new transports.Console({
      format: combine(colorize(), devFormat)
    }),

    new transports.File({
      level: "error",
      filename: "logs/error.log",
      handleExceptions: true,
      handleRejections: true,
    }),
    new transports.File({
      filename: "logs/app.log",
      level: "info",
    }),
  ],
  exitOnError: false,
});
