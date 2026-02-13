import { completeUploadService } from "@/services/video/complete";
import { fetchUserVideos } from "@/services/video/fetchuservideo";
import { signedUrlService } from "@/services/video/getsignedurl";
import { videoInItService } from "@/services/video/initService";
import type { components } from "@/types/api-types";
import type { Request, Response } from "express";

export type inItUploadRequest = components["schemas"]["InitVideoUploadRequest"];

export const initUploadControllerV1 = async (req: Request, res: Response) => {
  const videoMetaData = req.body as inItUploadRequest;
  const idempotencyKey = req.header("Idempotency-Key") as string;
  const result = await videoInItService(
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
  const { parts } = req.body as {
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
  const {
    page = 1,
    limit = 10,
    status,
  } = req.query as {
    page: string;
    limit?: string;
    status?: string;
  };

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

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
