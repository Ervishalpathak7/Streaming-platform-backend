import s3 from "@/config/s3.js";
import { InternalServerError } from "@/error/errors.js";
import { normalizeError } from "@/error/index.js";
import logger from "@/lib/winston.js";
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { S3_BUCKET } from "@/config/s3.js";

export const createMultipartUpload = async (
  key: string,
  contentType: string,
) => {
  if (!S3_BUCKET) {
    throw new Error("S3_BUCKET is not configured");
  }
  try {
    const command = new CreateMultipartUploadCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType || "video/mp4",
    });
    const response = await s3.send(command);
    return {
      uploadId: response.UploadId,
      S3key: response.Key,
    };
  } catch (error) {
    logger.error("Error in createMultipartUpload:", {
      key,
      contentType,
      error: normalizeError(error),
    });
    throw new InternalServerError(
      "Error creating multipart upload",
      normalizeError(error),
    );
  }
};

export const getUploadPartUrls = async (
  S3key: string,
  uploadId: string,
  totalParts: number,
) => {
  if (!S3_BUCKET) {
    throw new Error("S3_BUCKET is not configured");
  }
  const urls: { partNumber: number; signedUrl: string }[] = [];
  try {
    // Generate signed URLs in parallel for better performance
    const urlPromises = Array.from({ length: totalParts }, async (_, index) => {
      const partNumber = index + 1;
      const command = new UploadPartCommand({
        Bucket: S3_BUCKET,
        Key: S3key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });
      const signedUrl = await getSignedUrl(s3, command, { expiresIn: 5 * 60 });
      return { partNumber, signedUrl };
    });
    
    const results = await Promise.all(urlPromises);
    return results.sort((a, b) => a.partNumber - b.partNumber);
  } catch (error) {
    logger.error("Error in getUploadPartUrls:", {
      S3key,
      uploadId,
      totalParts,
      error: normalizeError(error),
    });
    throw new InternalServerError(
      "Error generating signed URLs for upload parts",
      normalizeError(error),
    );
  }
};
