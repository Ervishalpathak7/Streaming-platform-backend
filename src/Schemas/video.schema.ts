import z from "zod";

export const videoUploadInitSchema = z.object({
  title: z
    .string("Title is required")
    .min(3, "Title must be at least 3 characters long")
    .max(255, "Title must be at most 255 characters long"),
  fileName: z
    .string("Filename is required")
    .min(3, "Filename must be at least 3 characters long")
    .max(255, "Filename must be at most 255 characters long"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters long")
    .optional(),
  contentType: z.enum(
    ["video/mp4", "video/mkv", "video/avi"],
    "Invalid content type",
  ),
  fileSize: z
    .number()
    .min(5 * 1024 * 1024, "File size must be at least 5 MB")
    .max(1 * 1024 * 1024 * 1024, "File size must be at most 1 GB"),
});

export type VideoUploadInitInput = z.infer<typeof videoUploadInitSchema>;

export const videoUploadCompleteSchema = z.object({
  key: z.string().min(1),
  uploadId: z.string().min(1),
  parts: z
    .array(
      z.object({
        ETag: z.string().min(1),
        PartNumber: z.number().min(1),
      }),
    )
    .min(1),
});

export type VideoUploadCompleteInput = z.infer<
  typeof videoUploadCompleteSchema
>;
