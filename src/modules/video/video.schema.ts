import { z } from "zod";

export const createVideoSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  fileType: z.string().regex(/^video\/(mp4|webm|quicktime)$/),
  fileSize: z.number().max(1024 * 1024 * 1024 * 2), // 2GB
});

export const initiateUploadResponseSchema = z.object({
  videoId: z.string().uuid(),
  uploadUrl: z.string().url(),
});

export const videoResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(["INITIATED", "UPLOADED", "PUBLISHED", "FAILED"]),
  url: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const listVideoSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  cursor: z.string().uuid().optional(),
});

export const listVideoResponseSchema = z.object({
  items: z.array(videoResponseSchema),
  nextCursor: z.string().uuid().nullable(),
});

export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type ListVideoInput = z.infer<typeof listVideoSchema>;
