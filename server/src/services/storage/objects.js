import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3For, ensureBucket } from './s3Client.js';

export async function putObject(id, key, buffer, mime) {
  await ensureBucket(id);
  const { s3, cfg } = s3For(id);
  await s3.send(new PutObjectCommand({ Bucket: cfg.bucket, Key: key, Body: buffer, ContentType: mime }));
}

// Поток объекта: тело ответа S3 читается как Node-stream
export async function getObjectStream(id, key) {
  const { s3, cfg } = s3For(id);
  const res = await s3.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key }));
  return res.Body;
}
