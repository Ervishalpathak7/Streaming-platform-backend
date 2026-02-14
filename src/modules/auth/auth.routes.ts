import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  registerHandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
  meHandler,
} from "./auth.controller";
import {
  registerSchema,
  loginSchema,
  loginResponseSchema,
  registerResponseSchema,
  userSchema,
  refreshTokenSchema,
  refreshTokenResponseSchema,
} from "./auth.schema";
import { authenticate } from "../../common/middleware/auth.middleware";

export async function authRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/register",
    {
      schema: {
        body: registerSchema,
        response: {
          201: registerResponseSchema,
        },
        tags: ["Auth"],
      },
    },
    (req, res) => registerHandler(req as any, res),
  );

  app.withTypeProvider<ZodTypeProvider>().post(
    "/login",
    {
      schema: {
        body: loginSchema,
        response: {
          200: loginResponseSchema,
        },
        tags: ["Auth"],
      },
    },
    (req, res) => loginHandler(req as any, res),
  );

  app.post("/logout", (req, res) => logoutHandler(req as any, res));

  app.withTypeProvider<ZodTypeProvider>().post(
    "/refresh",
    {
      schema: {
        body: refreshTokenSchema,
        response: {
          200: refreshTokenResponseSchema,
        },
        tags: ["Auth"],
      },
    },
    (req, res) => refreshHandler(req as any, res),
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/me",
    {
      preHandler: [authenticate],
      schema: {
        response: {
          200: userSchema,
        },
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
      },
    },
    (req, res) => meHandler(req as any, res),
  );
}
