import express from "express";
import cors from "cors";
import * as trpcExpress from "@trpc/server/adapters/express";
import { createContext } from "../trpc/context.js";
import { trpcRouter } from "@/routes/v3/trpcRouter.js";

const server = express();
server.set("trust proxy", true);

const allowedOrigins = [
  "https://streamkaro.app",
  "http://localhost:5173",
  "https://www.streamkaro.app",
];
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
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: trpcRouter,
    createContext: createContext,
  }),
);

export default server;
