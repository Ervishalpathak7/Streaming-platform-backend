import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateVideoInput,
  ListVideoInput,
  CompleteUploadInput,
} from "./video.schema";
import {
  initiateUpload,
  getSignedUrls,
  completeMultipartUpload,
  getVideoById,
  listVideos,
} from "./video.service";
import { StatusCodes } from "http-status-codes";

export async function initiateUploadHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const result = await initiateUpload(userId, request.body as CreateVideoInput);
  reply.code(StatusCodes.OK).send(result);
}

export async function getSignedUrlsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { videoId } = request.params as { videoId: string };
  const result = await getSignedUrls(videoId, userId);
  reply.code(StatusCodes.OK).send(result);
}

export async function completeUploadHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { videoId } = request.params as { videoId: string };
  const result = await completeMultipartUpload(
    videoId,
    userId,
    request.body as CompleteUploadInput,
  );
  reply.code(StatusCodes.OK).send(result);
}

export async function getVideoHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { videoId } = request.params as { videoId: string };
  const result = await getVideoById(videoId, userId);
  reply.code(StatusCodes.OK).send(result);
}

export async function listVideosHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { limit, cursor } = request.query as ListVideoInput;
  const result = await listVideos(userId, limit, cursor);
  reply.code(StatusCodes.OK).send(result);
}
