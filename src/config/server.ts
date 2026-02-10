import express from "express";
import cors from "cors";
import * as trpcExpress from "@trpc/server/adapters/express";
import { createContext } from "../trpc/context.js";
import { generateOpenApiDocument } from "trpc-to-openapi";
import { trpcRouter } from "@/routes/appRouter.js";

const server = express();
server.set("trust proxy", true);

const allowedOrigins = [
  "https://streamkaro.app",
  "http://localhost:5173",
  "https://www.streamkaro.app",
];

export const openApiDocumentV2 = generateOpenApiDocument(trpcRouter.v3, {
  title: "StreamKaro API Documentation",
  version: "2.0.1",
  baseUrl: "http://localhost:3000",
  tags: ["User", "Video"],
});

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

server.use(express.urlencoded({ extended: true, limit: "16kb" }));
server.use(express.json({ limit: "16kb" }));

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

server.get("/api/v3/docs", (req, res) => {
  res.json(openApiDocumentV2);
});

export default server;
