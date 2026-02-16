import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  initiateUploadHandler,
  getSignedUrlsHandler,
  completeUploadHandler,
  getVideoHandler,
  listVideosHandler,
} from "./video.controller";
import {
  createVideoSchema,
  initiateUploadResponseSchema,
  getSignedUrlResponseSchema,
  completeUploadRequestSchema,
  completeUploadResponseSchema,
  videoResponseSchema,
  listVideoSchema,
  listVideoResponseSchema,
} from "./video.schema";
import { authenticate } from "../../common/middleware/auth.middleware";
import {
  idempotencyMiddleware,
  saveIdempotencyResponse,
} from "../../common/middleware/idempotency.middleware";
import { z } from "zod";
import { videoRateLimit } from "@common/middleware/ratelimit.middleware";

export async function videoRoutes(app: FastifyInstance) {
  await videoRateLimit(app);
  app.withTypeProvider<ZodTypeProvider>().post(
    "/init",
    {
      preHandler: [authenticate, idempotencyMiddleware],
      schema: {
        body: createVideoSchema,
        response: {
          200: initiateUploadResponseSchema,
        },
        tags: ["Videos"],
        security: [{ bearerAuth: [] }],
      },
      onSend: [saveIdempotencyResponse],
    },
    initiateUploadHandler,
  );

  // GET /videos/signedurl/:videoId - Get presigned URLs for multipart upload
  app.withTypeProvider<ZodTypeProvider>().get(
    "/signedurl/:videoId",
    {
      preHandler: [authenticate],
      schema: {
        params: z.object({ videoId: z.string().uuid() }),
        response: {
          200: getSignedUrlResponseSchema,
        },
        tags: ["Videos"],
        security: [{ bearerAuth: [] }],
      },
    },
    getSignedUrlsHandler,
  );

  // POST /videos/complete/:videoId - Complete multipart upload
  app.withTypeProvider<ZodTypeProvider>().post(
    "/complete/:videoId",
    {
      preHandler: [authenticate],
      schema: {
        params: z.object({ videoId: z.string().uuid() }),
        body: completeUploadRequestSchema,
        response: {
          200: completeUploadResponseSchema,
        },
        tags: ["Videos"],
        security: [{ bearerAuth: [] }],
      },
    },
    completeUploadHandler,
  );

  // GET /videos/:videoId - Get video metadata
  app.withTypeProvider<ZodTypeProvider>().get(
    "/:videoId",
    {
      preHandler: [authenticate],
      schema: {
        params: z.object({ videoId: z.string().uuid() }),
        response: {
          200: videoResponseSchema,
        },
        tags: ["Videos"],
        security: [{ bearerAuth: [] }],
      },
    },
    getVideoHandler,
  );

  // GET /videos/mine - List user's videos
  app.withTypeProvider<ZodTypeProvider>().get(
    "/mine",
    {
      preHandler: [authenticate],
      schema: {
        querystring: listVideoSchema,
        response: {
          200: listVideoResponseSchema,
        },
        tags: ["Videos"],
        security: [{ bearerAuth: [] }],
      },
    },
    listVideosHandler,
  );
}
