import express from "express";
import cors from "cors";
import appRouter from "@/routes/appRouter.js";
import { requestTimer } from "@/utils/request-timer.js";
import { errorHandler } from "@/middlewares/errorHandler.middleware.js";
import OpenApiValidator from "express-openapi-validator";
import path from "path";
import { fileURLToPath } from "url";
import logger from "@/lib/winston.js";


const server = express();
server.set("trust proxy", true);
server.use(express.json({ limit: "16kb" }));
server.use(express.urlencoded({ extended: true, limit: "16kb" }));

server.use(requestTimer);

const getAllowedOrigins = (): string[] => {
  const origins = [
    "https://streamkaro.app",
    "http://localhost:5173",
    "https://www.streamkaro.app",
  ];
  
  // Allow additional origins from environment variable
  if (process.env.ALLOWED_ORIGINS) {
    const additionalOrigins = process.env.ALLOWED_ORIGINS.split(",").map((o) =>
      o.trim(),
    );
    origins.push(...additionalOrigins);
  }
  
  return origins;
};

const allowedOrigins = getAllowedOrigins();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

server.use(
  OpenApiValidator.middleware({
    apiSpec: path.join(__dirname, "../openapi.yml"),
    validateRequests: true,
    validateResponses: true,
  }),
);

server.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        // In production, be more strict
        if (process.env.NODE_ENV === "production") {
          return callback(new Error("Not allowed by CORS"));
        }
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn("CORS blocked origin:", { origin, allowedOrigins });
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    exposedHeaders: ["Authorization"],
  }),
);

// routes
server.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// REST API routes v1
server.use("/api/v1", appRouter);

server.use(errorHandler);

export default server;
