import { S3Client } from "@aws-sdk/client-s3";

export const S3_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB

if (
  !process.env.S3_REGION ||
  !process.env.S3_ACCESS_KEY_ID ||
  !process.env.S3_SECRET_ACCESS_KEY
) {
  throw new Error("Missing S3 configuration in environment variables");
}

// S3 configuration
const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  maxAttempts: 3, // Retry up to 3 times on failure
  responseChecksumValidation: "WHEN_REQUIRED",
  requestChecksumCalculation: "WHEN_REQUIRED",
});

export default s3;
