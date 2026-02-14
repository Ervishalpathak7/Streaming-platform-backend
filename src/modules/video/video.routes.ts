import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  initiateUploadHandler,
  confirmUploadHandler,
  listVideosHandler,
} from "./video.controller";
import {
  createVideoSchema,
  initiateUploadResponseSchema,
  listVideoSchema,
  listVideoResponseSchema,
} from "./video.schema";
import { authenticate } from "../../common/middleware/auth.middleware";
import {
  idempotencyMiddleware,
  saveIdempotencyResponse,
} from "../../common/middleware/idempotency.middleware";
import { z } from "zod";

export async function videoRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/",
    {
      preHandler: [authenticate],
      schema: {
        body: createVideoSchema,
        response: {
          201: initiateUploadResponseSchema,
        },
        tags: ["Video"],
        security: [{ bearerAuth: [] }],
      },
      // onSend: [saveIdempotencyResponse],
    },
    (req, res) => initiateUploadHandler(req as any, res),
  );

  app.withTypeProvider<ZodTypeProvider>().put(
    "/:id/confirm",
    {
      preHandler: [authenticate],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        tags: ["Video"],
        security: [{ bearerAuth: [] }],
      },
    },
    (req, res) => confirmUploadHandler(req as any, res),
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/",
    {
      preHandler: [authenticate],
      schema: {
        querystring: listVideoSchema,
        response: {
          200: listVideoResponseSchema,
        },
        tags: ["Video"],
        security: [{ bearerAuth: [] }],
      },
    },
    (req, res) => listVideosHandler(req as any, res),
  );
}
