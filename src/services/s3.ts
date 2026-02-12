import s3 from "@/config/s3.js";
import logger from "@/lib/winston.js";
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const createMultipartUpload = async (
  key: string,
  contentType: string,
) => {
  try {
    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: contentType || "video/mp4",
    });
    const response = await s3.send(command);
    return {
      uploadId: response.UploadId,
      S3key: response.Key,
    };
  } catch (error) {
    logger.error("Error in createMultipartUpload:", error);
    throw error;
  }
};

export const getUploadPartUrls = async (
  S3key: string,
  uploadId: string,
  totalParts: number,
) => {
  const urls: { partNumber: number; signedUrl: string }[] = [];
  try {
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const command = new UploadPartCommand({
        Bucket: process.env.S3_BUCKET,
        Key: S3key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });
      const signedUrl = await getSignedUrl(s3, command, { expiresIn: 5 * 60 });
      urls.push({ partNumber, signedUrl });
    }

    return urls;
  } catch (error) {
    logger.error("Error in getUploadPartUrls:", error);
    throw error;
  }
};

