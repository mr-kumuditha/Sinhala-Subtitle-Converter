import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
    ...(process.env.AWS_S3_ENDPOINT && { endpoint: process.env.AWS_S3_ENDPOINT }),
});

export const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "sisub-bucket";

/**
 * Uploads a file buffer or string to S3 and returns the key
 */
export async function uploadToS3(key: string, body: Buffer | string, contentType: string = "text/plain") {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
    });

    await s3.send(command);
    return key;
}

/**
 * Generates a presigned URL to securely download a file from S3 (valid for 1 hour)
 */
export async function getDownloadUrl(key: string) {
    if (!key) return null;

    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    return getSignedUrl(s3, command, { expiresIn: 3600 });
}
