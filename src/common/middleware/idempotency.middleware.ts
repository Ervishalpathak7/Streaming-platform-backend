import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import { prisma } from "../database/prisma";
import { AppError } from "../errors/error-handler";
import { StatusCodes } from "http-status-codes";
import { logger } from "../logger/logger";
import { User } from "@prisma/client";
import { cacheService } from "@common/cache/cache.service";

declare module "fastify" {
  interface FastifyRequest {
    idempotencyKey?: string;
  }
}

export async function idempotencyMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const idempotencyKey = request.headers["Idempotency-key"] as string;
  if (!idempotencyKey)
    throw new AppError("Idempotency key not provided", StatusCodes.BAD_REQUEST);

  const userId = (request.user as User)?.id;
  if (!userId) throw new AppError("User not found", StatusCodes.UNAUTHORIZED);

  const cachedKey = await cacheService.getIdempotencyKey(idempotencyKey);
  if (cachedKey) {
    request.idempotencyKey = cachedKey;
    return;
  }

  const existingKey = await prisma.idempotencyKey.findUnique({
    where: { key: idempotencyKey },
  });

  if (existingKey) {
    await cacheService.setIdempotencyKey(existingKey.key);
    if (existingKey.userId !== userId) {
      throw new AppError(
        "Idempotency key belongs to another user",
        StatusCodes.FORBIDDEN,
      );
    }

    if (existingKey.statusCode) {
      const body = existingKey.responseBody
        ? JSON.parse(existingKey.responseBody)
        : undefined;
      request.idempotencyKey = existingKey.key;
      reply
        .code(existingKey.statusCode)
        .header("X-Idempotency-Key", idempotencyKey)
        .header("Content-Type", "application/json; charset=utf-8")
        .send(body);

      return reply;
    } else {
      // LOCKED
      throw new AppError(
        "Request with this Idempotency-Key is currently being processed",
        StatusCodes.CONFLICT,
      );
    }
  }

  // MISS - Create Lock
  try {
    await prisma.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        userId,
        path: request.routeOptions.url || request.routerPath,
        method: request.method,
      },
    });
  } catch (e) {
    throw new AppError("Concurrent request detected", StatusCodes.CONFLICT);
  }

  console.log("[Middleware] Lock created, proceeding.");
  reply.header("X-Idempotency-Key", idempotencyKey);
}

export async function saveIdempotencyResponse(
  request: FastifyRequest,
  reply: FastifyReply,
  payload: any,
) {
  // If response was served from cache, we DO NOT return the payload.
  // Wait, onSend hook expects payload to be returned if strict serialization is off?
  // Fastify documentation says: "The onSend hook receives the payload... and must return the payload (modified or not)".

  // If we served from cache, we don't need to do anything DB related.
  if ((request as any).idempotencyCached) {
    return payload;
  }

  const key = request.idempotencyKey;
  if (!key) return payload;

  if (reply.statusCode >= 500) {
    await prisma.idempotencyKey.deleteMany({ where: { key } }).catch(() => {});
    return payload;
  }

  // Only save if it's a JSON response (usually string if serialized, or object)
  // We try to catch errors to avoid crashing the response
  try {
    await prisma.idempotencyKey.updateMany({
      where: {
        key,
        statusCode: null,
      },
      data: {
        statusCode: reply.statusCode,
        responseBody:
          typeof payload === "string" ? payload : JSON.stringify(payload),
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to save idempotency response");
  }

  return payload;
}
