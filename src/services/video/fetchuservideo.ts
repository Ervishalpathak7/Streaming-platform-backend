import {
  InternalServerError,
  invalidQueryParameterError,
  QueryLimitExceededError,
} from "@/error";
import Video, { type VideoType } from "@/models/video.model";

export const fetchUserVideos = async (
  userId: string,
  page: number,
  limit: number,
  status?: string,
) => {
  const query = { owner: userId };
  if (limit > 50) throw new QueryLimitExceededError("Limit cannot exceed 50");
  if (status && !["UPLOADED", "PROCESSING", "READY", "FAILED"].includes(status))
    throw new invalidQueryParameterError(
      "status",
      `Invalid status value: ${status}`,
    );

  try {
    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const processingVideos: VideoType[] = [];
    const readyVideos: VideoType[] = [];

    const totalVideos = await Video.countDocuments(query);
    const totalPages = Math.ceil(totalVideos / limit);

    videos.forEach((video) => {
      if (video.status === "PROCESSING") {
        processingVideos.push(video);
      } else if (video.status === "READY") {
        readyVideos.push(video);
      }
    });

    return { videos, totalPages, processingVideos, readyVideos };
  } catch (error) {
    throw new InternalServerError(
      "Failed to fetch videos",
      error instanceof Error ? error : new Error(String(error)),
    );
  }
};
