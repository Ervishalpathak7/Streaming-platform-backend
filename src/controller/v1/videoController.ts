import { completeUploadService } from "@/services/video/complete.js";
import { fetchUserVideos } from "@/services/video/fetchuservideo.js";
import { signedUrlService } from "@/services/video/getsignedurl.js";
import { videoInitService } from "@/services/video/initService.js";
import type { components } from "@/types/api-types.js";
import type { Request, Response } from "express";
import {
  validateObjectId,
  validatePagination,
  validateIdempotencyKey,
  sanitizeInput,
} from "@/utils/validation.js";

export type InitUploadRequest = components["schemas"]["InitVideoUploadRequest"];

export const initUploadControllerV1 = async (req: Request, res: Response) => {
  const videoMetaData = sanitizeInput(req.body) as InitUploadRequest;
  const idempotencyKey = req.header("Idempotency-Key");
  
  if (!idempotencyKey) {
    return res.status(400).json({
      status: "error",
      message: "Idempotency-Key header is required",
    });
  }
  
  validateIdempotencyKey(idempotencyKey);
  
  const result = await videoInitService(
    videoMetaData,
    idempotencyKey,
    req.userId as string,
  );
  if (result.status !== "INITIATED") {
    return res.status(200).json({
      status: result.status,
      videoId: result.id,
    });
  }

  return res.status(201).json({
    status: result.status,
    videoId: result.id,
  });
};

export const getSignedUrlControllerV1 = async (req: Request, res: Response) => {
  const { videoId } = req.params as { videoId: string };
  validateObjectId(videoId, "videoId");
  const result = await signedUrlService(videoId, req.userId as string);
  if (!result.signedUrls) {
    return res.status(200).json({ status: result.status });
  }

  return res.status(200).json({
    status: result.status,
    signedUrls: result.signedUrls,
  });
};

export const completeUploadControllerV1 = async (
  req: Request,
  res: Response,
) => {
  const { videoId } = req.params as { videoId: string };
  validateObjectId(videoId, "videoId");
  const { parts } = sanitizeInput(req.body) as {
    parts: { partNumber: number; etag: string }[];
  };

  const result = await completeUploadService(
    videoId,
    req.userId as string,
    parts,
  );

  return res.status(200).json({
    id: result.id,
    status: result.status,
  });
};

export const getMyVideosControllerV1 = async (req: Request, res: Response) => {
  const { page, limit, status } = req.query as {
    page?: string;
    limit?: string;
    status?: string;
  };

  const { page: pageNum, limit: limitNum } = validatePagination(page, limit);

  const videos = await fetchUserVideos(
    req.userId as string,
    pageNum,
    limitNum,
    status,
  );

  return res.status(200).json({
    status: "success",
    data: {
      videos: videos.videos,
      processingVideos: videos.processingVideos,
      completedVideos: videos.readyVideos,
      totalPages: videos.totalPages,
      currentPage: pageNum,
    },
  });
};
