import s3 from "../config.js"
import { CreateMultipartUploadCommand, UploadPartCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { logger } from "../utils/winston.js"

export const createMultipartUpload = async (key, contentType) => {
    try {
        const command = new CreateMultipartUploadCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
            ContentType: contentType || "video/mp4",
        })
        const response = await s3.send(command)
        return {
            uploadId: response.UploadId,
            key: response.Key,
        }
    } catch (error) {
        logger.error("Error in createMultipartUpload:", error)
        throw error
    }
}

export const getUploadPartUrls = async (key, uploadId, totalParts) => {
    const urls = [];
    try {
        for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
            const command = new UploadPartCommand({
                Bucket: process.env.S3_BUCKET,
                Key: key,
                UploadId: uploadId,
                PartNumber: partNumber,
            });
            console.log(`Generating signed URL for part ${partNumber}`);
            const signedUrl = await getSignedUrl(s3, command, { expiresIn: 5 * 60 });
            urls.push({ partNumber, signedUrl });
        }

        return urls;

    } catch (error) {
        logger.error("Error in getUploadPartUrl:", error)
        throw error
    }
}