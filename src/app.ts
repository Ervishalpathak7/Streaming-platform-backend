import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import cookie from "@fastify/cookie";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
} from "fastify-type-provider-zod";
import { config } from "./common/config/config";
import { logger } from "./common/logger/logger";
import { globalErrorHandler } from "./common/errors/error-handler";
import { connectDB, disconnectDB } from "./common/database/prisma";
import { authRoutes } from "./modules/auth/auth.routes";
import { videoRoutes } from "./modules/video/video.routes";
import { userRoutes } from "./modules/user/user.routes";
import { runCleanupJob } from "./jobs/cleanup.job";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // We use our own Pino instance
  });

  // Zod Validation Setup
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Security Headers
  await app.register(helmet, { global: true });

  // Cookie
  await app.register(cookie);

  // CORS
  await app.register(cors, {
    origin: [
      config.FRONTEND_URL,
      "https://streamkaro.app",
      "http://localhost:5173", // Common Vite dev port
    ],
    credentials: true, // Required for cookies (RefreshToken)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Authorization"],
  });

  // Rate Limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // Swagger (OpenAPI)
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Video Streaming API",
        description: "OpenAPI 3.1 documentation for Video Streaming Platform",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://${config.HOST}:${config.PORT}`,
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    transform: jsonSchemaTransform, // Auto-Generate OpenAPI from Zod
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/documentation",
  });

  // Global Error Handler
  app.setErrorHandler(globalErrorHandler);

  // Register Routes
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(videoRoutes, { prefix: "/api/v1/videos" });
  await app.register(userRoutes, { prefix: "/api/v1/user" });

  // Health Check
  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  return app;
}

export async function startServer() {
  const app = await buildApp();
  await connectDB();

  // Start cleanup job (runs immediately, then every hour)
  runCleanupJob();
  setInterval(runCleanupJob, 60 * 60 * 1000); // Every hour

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    logger.info(`Server running at http://${config.HOST}:${config.PORT}`);
    logger.info(
      `Documentation at http://${config.HOST}:${config.PORT}/documentation`,
    );
  } catch (err) {
    logger.error(err, "Failed to start server");
    process.exit(1);
  }

  // Graceful Shutdown Hook
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info(`Got ${signal}. Graceful shutdown...`);
      await app.close();
      await disconnectDB();
      process.exit(0);
    });
  }
}
