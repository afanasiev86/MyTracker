import { S3Client, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import { PROVIDERS, providerConfig, isConfigured } from './providers.js';
import { domainError } from '../errors.js';

// Клиент создаётся один раз на провайдера
const clients = new Map();
export function s3For(id) {
  if (!clients.has(id)) {
    const cfg = providerConfig(id);
    if (!isConfigured(cfg)) {
      throw domainError('unavailable', `${PROVIDERS[id].label} не настроен`);
    }
    clients.set(id, {
      cfg,
      s3: new S3Client({
        endpoint: cfg.endpoint,
        region: cfg.region,
        forcePathStyle: true,
        credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
      }),
    });
  }
  return clients.get(id);
}

// Бакет создаётся при первом обращении, если его ещё нет
const bucketChecked = new Set();
export async function ensureBucket(id) {
  if (bucketChecked.has(id)) return;
  const { s3, cfg } = s3For(id);
  try {
    await s3.send(new HeadBucketCommand({ Bucket: cfg.bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: cfg.bucket }));
  }
  bucketChecked.add(id);
}
