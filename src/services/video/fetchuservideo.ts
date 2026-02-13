import {
  InternalServerError,
  InvalidQueryParameterError,
  QueryLimitExceededError,
} from "@/error/errors.js";
import { normalizeError } from "@/error/index.js";
import logger from "@/lib/winston.js";
import Video, { type VideoType } from "@/models/video.model.js";

export const fetchUserVideos = async (
  userId: string,
  page: number,
  limit: number,
  status?: string,
) => {
  const query: { owner: string; status?: string } = { owner: userId };
  
  if (limit > 50) throw new QueryLimitExceededError("Limit cannot exceed 50");
  
  // Add status filter to query if provided
  if (status) {
    if (!["INITIATED", "UPLOADED", "PROCESSING", "READY", "FAILED"].includes(status))
      throw new InvalidQueryParameterError(
        "status",
        `Invalid status value: ${status}`,
      );
    query.status = status;
  }

  try {
    // Use single query with aggregation for better performance
    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(); // Use lean() for better performance when not modifying documents

    // Get counts efficiently using aggregation if status filter not applied
    let processingVideos: VideoType[] = [];
    let readyVideos: VideoType[] = [];

    if (!status) {
      // Only categorize if status filter not applied
      videos.forEach((video) => {
        if (video.status === "PROCESSING") {
          processingVideos.push(video);
        } else if (video.status === "READY") {
          readyVideos.push(video);
        }
      });
    }

    // Use countDocuments for accurate count
    const totalVideos = await Video.countDocuments(query);
    const totalPages = Math.ceil(totalVideos / limit);

    return { videos, totalPages, processingVideos, readyVideos };
  } catch (error) {
    logger.error("Error in fetchUserVideos:", {
      userId: userId,
      page: page,
      limit: limit,
      status: status,
      error: normalizeError(error),
    });
    throw new InternalServerError(
      "Failed to fetch videos",
      normalizeError(error),
    );
  }
};
