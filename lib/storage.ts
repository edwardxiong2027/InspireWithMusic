import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

let s3Client: import("@aws-sdk/client-s3").S3Client | undefined;

async function s3() {
  if (!s3Client) {
    const { S3Client } = await import("@aws-sdk/client-s3");
    s3Client = new S3Client({ region: process.env.AWS_REGION ?? "us-west-2" });
  }
  return s3Client;
}

export function storageProvider() {
  return process.env.AWS_S3_BUCKET ? "Amazon S3" : "Local filesystem";
}

export async function storeMedia(key: string, bytes: Uint8Array, contentType: string) {
  if (process.env.AWS_S3_BUCKET) {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    await (await s3()).send(new PutObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: `media/${key}`, Body: bytes, ContentType: contentType, CacheControl: "public,max-age=31536000,immutable" }));
  } else {
    const uploadDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, key), bytes);
  }
  return `/uploads/${key}`;
}

export async function readMedia(key: string) {
  if (process.env.AWS_S3_BUCKET) {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const result = await (await s3()).send(new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: `media/${key}` }));
    if (!result.Body) throw new Error("Missing media body");
    return { bytes: await result.Body.transformToByteArray(), contentType: result.ContentType };
  }
  return { bytes: await readFile(path.join(process.cwd(), "uploads", key)), contentType: undefined };
}
