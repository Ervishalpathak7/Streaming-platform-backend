import { PutObjectCommand } from "@aws-sdk/client-s3"
import s3 from "../config.js"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { logger } from "../utils/winston.js"

export const generatePutObjectPresignedUrl = async () => {
    try {
        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: `videos/test-video-${Date.now()}.mp4`,
            ContentType: "video/mp4",
        })
        const presignedUrl = await getSignedUrl(s3, command, {
            expiresIn: 5 * 60 // 5 minutes
        });
        return presignedUrl;
    } catch (error) {
        logger.error("Failed to generate presigned URL", {
            category: "s3",
            service: "app",
            code: "PRESIGNED_URL_GENERATION_FAILED",
            lifecycle: "process",
            error: error,
        });
        throw error;
    }
}