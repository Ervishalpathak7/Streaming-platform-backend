import express from "express";
import cors from "cors";
import appRouter  from "@/routes/appRouter.js";
import { requestTimer } from "@/utils/request-timer.js";
import { errorHandler } from "@/middlewares/errorHandler.middleware.js";
import OpenApiValidator from "express-openapi-validator";
import path from "path";

const server = express();
server.set("trust proxy", true);
server.use(express.json({ limit: "16kb" }));
server.use(express.urlencoded({ extended: true, limit: "16kb" }));

server.use(requestTimer);

const allowedOrigins = [
  "https://streamkaro.app",
  "http://localhost:5173",
  "https://www.streamkaro.app",
];

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
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS"));
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
