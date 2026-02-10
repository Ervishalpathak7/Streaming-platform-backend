import express from "express";
import cors from "cors";
import * as trpcExpress from "@trpc/server/adapters/express";
import { createContext } from "../trpc/context.js";
import { generateOpenApiDocument } from "trpc-to-openapi";
import { trpcRouter } from "@/routes/appRouter.js";
import fs from "fs";
import * as OpenApiValidator from "express-openapi-validator";
import { requestTimer } from "@/utils/request-timer.js";
import { errorHandler } from "@/middlewares/errorHandler.middleware.js";

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

export const openApiDocumentV3 = generateOpenApiDocument(trpcRouter.v3, {
  title: "StreamKaro API Documentation",
  version: "3.0.0",
  baseUrl: "http://localhost:3000/api/v3",
  tags: ["User", "Video"],
});

// create a docs folder if it doesn't exist
if (!fs.existsSync("docs")) {
  fs.mkdirSync("docs");
}
fs.writeFileSync(
  "docs/openApiDocumentV3.json",
  JSON.stringify(openApiDocumentV3, null, 2),
);

server.use(
  "/api/v3",
  OpenApiValidator.middleware({
    apiSpec: "docs/openApiDocumentV3.json",
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
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    exposedHeaders: ["Authorization"],
  }),
);

// routes
server.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});
server.use(
  "/api/v3",
  trpcExpress.createExpressMiddleware({
    router: trpcRouter.v3,
    createContext: createContext,
  }),
);

server.get("/api/docs/v3", (req, res) => {
  res.json(openApiDocumentV3);
});

server.use(errorHandler);

export default server;
