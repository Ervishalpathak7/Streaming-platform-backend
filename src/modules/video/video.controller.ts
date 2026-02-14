import { FastifyRequest, FastifyReply } from "fastify";
import { CreateVideoInput, ListVideoInput } from "./video.schema";
import { initiateUpload, confirmUpload, listVideos } from "./video.service";
import { StatusCodes } from "http-status-codes";

export async function initiateUploadHandler(
  request: FastifyRequest<{ Body: CreateVideoInput }>,
  reply: FastifyReply,
) {
  // TODO: Get userId from request.user (Auth Middleware)
  // For now assuming it's attached by middleware
  const userId = (request.user as any).id;

  const result = await initiateUpload(userId, request.body);
  reply.code(StatusCodes.CREATED).send(result);
}

export async function confirmUploadHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const userId = (request.user as any).id;
  const result = await confirmUpload(request.params.id, userId);
  reply.code(StatusCodes.OK).send(result);
}

export async function listVideosHandler(
  request: FastifyRequest<{ Querystring: ListVideoInput }>,
  reply: FastifyReply,
) {
  const userId = (request.user as any).id;
  const { limit, cursor } = request.query;
  const result = await listVideos(userId, limit, cursor);
  reply.code(StatusCodes.OK).send(result);
}
