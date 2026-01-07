import { createLogger, format, transports } from "winston";
const { combine, timestamp, errors, json, colorize, printf } = format;

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

const devFormat = printf(({ level, message, timestamp, stack }) => {
  return stack
    ? `${timestamp} ${level}: ${message}\n${stack}`
    : `${timestamp} ${level}: ${message}`;
});

export const logger = createLogger({
  level: "info",
  format: combine(errors({ stack: true }), json()),
  transports: [
    // Console for dev
    new transports.Console({
      format: combine(colorize(), devFormat),
    }),

    // File for errors
    new transports.File({
      filename: "logs/combined.log",
    }),
  ],
});
