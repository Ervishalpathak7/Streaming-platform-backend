import { AppError } from "@common/errors/error-handler";
import { prisma } from "../../common/database/prisma";
import { CreateVideoInput } from "./video.schema";
import { StatusCodes } from "http-status-codes";
import { isValidUUID } from "./video.service";

export async function createVideo(data: CreateVideoInput & { userId: string }) {
  return prisma.video.create({
    data: {
      title: data.title,
      description: data.description,
      filename: data.filename,
      filesize: data.filesize,
      filetype: data.filetype,
      status: "INITIATED",
      userId: data.userId,
    },
  });
}

export async function findVideoById(id: string) {
  return prisma.video.findUnique({
    where: { id },
  });
}

export async function updateVideoUploadId(id: string, uploadId: string) {
  return prisma.video.update({
    where: { id },
    data: { uploadId },
  });
}

export async function updateVideoPlaybackUrl(id: string, url: string) {
  return prisma.video.update({
    where: { id },
    data: { playbackUrl: url },
  });
}

export async function updateVideoStatus(
  id: string,
  status: "UPLOADING" | "PROCESSING" | "READY" | "FAILED",
) {
  return prisma.video.update({
    where: { id },
    data: { status },
  });
}

export async function findVideosByUserId(
  userId: string,
  limit: number,
  cursor?: string,
) {
  // Verify cursor is valid
  if (cursor && !isValidUUID(cursor)) {
    throw new AppError("Invalid cursor format", StatusCodes.BAD_REQUEST);
  }

  return prisma.video.findMany({
    where: { userId },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
  });
}
