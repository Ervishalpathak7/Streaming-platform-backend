import { z } from "zod";

export const createVideoSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  filename: z.string(),
  filesize: z
    .number()
    .min(1)
    .max(1024 * 1024 * 1024), // 1GB
  filetype: z.enum(["video/mp4", "video/webm", "video/mkv", "video/mov"]),
});

export const initiateUploadResponseSchema = z.object({
  status: z.literal("success"),
  videoId: z.string().uuid(),
});

export const getSignedUrlResponseSchema = z.object({
  status: z.literal("success"),
  data: z.object({
    signedUrls: z.array(
      z.object({
        partNumber: z.number(),
        url: z.string().url(),
      }),
    ),
  }),
});

export const completeUploadRequestSchema = z.object({
  parts: z.array(
    z.object({
      partNumber: z.number(),
      eTag: z.string(),
    }),
  ),
});

export const completeUploadResponseSchema = z.object({
  status: z.literal("success"),
  message: z.string(),
});

export const videoResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(["INITIATED", "UPLOADING", "PROCESSING", "READY", "FAILED"]),
  playbackUrl: z.union([z.string().url(), z.null()]),
  thumbnailUrl: z.union([z.string().url(), z.null()]),
  createdAt: z.coerce.date(),
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
export type CompleteUploadInput = z.infer<typeof completeUploadRequestSchema>;
