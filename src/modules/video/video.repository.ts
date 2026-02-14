import { prisma } from "../../common/database/prisma";
import { CreateVideoInput } from "./video.schema";

export async function createVideo(data: CreateVideoInput & { userId: string }) {
  return prisma.video.create({
    data: {
      title: data.title,
      description: data.description,
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

export async function updateVideoStatus(
  id: string,
  status: "UPLOADED" | "PUBLISHED" | "FAILED",
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
  return prisma.video.findMany({
    where: { userId },
    take: limit + 1, // Fetch one extra to determine if there's a next page
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
  });
}
