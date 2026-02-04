import 'dotenv/config';
import { S3Client } from "@aws-sdk/client-s3";
import './index.js'

// S3 configuration
const s3 = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
    maxRetries: 3,
    requestTimeout: 10000,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED"
});

export default s3;