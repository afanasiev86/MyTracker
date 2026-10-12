import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import Settings from '../models/Settings.js';

// Хранилище вложений. Оба варианта говорят по протоколу S3, поэтому драйвер один.
// Секреты задаются только в переменных окружения, в базе хранится лишь выбранный провайдер.
export const PROVIDERS = {
  minio: { label: 'MinIO (свой сервер)' },
  s3: { label: 'S3 в облаке reg.ru' },
};

// Настройки провайдера из окружения. Для MinIO адрес собирается из хоста и порта.
function providerConfig(id) {
  if (id === 'minio') {
    const { MINIO_ENDPOINT, MINIO_PORT, MINIO_USE_SSL, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET } = process.env;
    return {
      endpoint: MINIO_ENDPOINT ? `${MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${MINIO_ENDPOINT}:${MINIO_PORT || 9000}` : '',
      region: 'us-east-1',
      accessKeyId: MINIO_ACCESS_KEY || '',
      secretAccessKey: MINIO_SECRET_KEY || '',
      bucket: MINIO_BUCKET || 'mytracker-attachments',
    };
  }
  const { S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET } = process.env;
  return {
    endpoint: S3_ENDPOINT || '',
    region: S3_REGION || 'us-east-1',
    accessKeyId: S3_ACCESS_KEY || '',
    secretAccessKey: S3_SECRET_KEY || '',
    bucket: S3_BUCKET || 'mytracker-attachments',
  };
}

function isConfigured(cfg) {
  return Boolean(cfg.endpoint && cfg.accessKeyId && cfg.secretAccessKey && cfg.bucket);
}

// Состояние для интерфейса: какие провайдеры настроены (значения ключей не отдаём)
export function providerStatus(id) {
  const cfg = providerConfig(id);
  return { id, label: PROVIDERS[id].label, configured: isConfigured(cfg), bucket: cfg.bucket };
}

export function listProviders() {
  return Object.keys(PROVIDERS).map(providerStatus);
}

export async function getActiveProvider() {
  const doc = await Settings.findOne({ key: 'storage' }).lean();
  const chosen = doc?.provider || process.env.ATTACHMENT_STORAGE || 'minio';
  return PROVIDERS[chosen] ? chosen : 'minio';
}

export async function setActiveProvider(id) {
  if (!PROVIDERS[id]) throw Object.assign(new Error('Неизвестное хранилище'), { status: 400 });
  if (!providerStatus(id).configured) {
    throw Object.assign(new Error(`${PROVIDERS[id].label} не настроен: заполните переменные окружения`), { status: 400 });
  }
  await Settings.updateOne({ key: 'storage' }, { $set: { provider: id } }, { upsert: true });
  return id;
}

// Клиент создаётся один раз на провайдера
const clients = new Map();
function client(id) {
  if (!clients.has(id)) {
    const cfg = providerConfig(id);
    if (!isConfigured(cfg)) {
      throw Object.assign(new Error(`${PROVIDERS[id].label} не настроен`), { status: 503 });
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

const bucketChecked = new Set();
async function ensureBucket(id) {
  if (bucketChecked.has(id)) return;
  const { s3, cfg } = client(id);
  try {
    await s3.send(new HeadBucketCommand({ Bucket: cfg.bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: cfg.bucket }));
  }
  bucketChecked.add(id);
}

export async function putObject(id, key, buffer, mime) {
  await ensureBucket(id);
  const { s3, cfg } = client(id);
  await s3.send(new PutObjectCommand({ Bucket: cfg.bucket, Key: key, Body: buffer, ContentType: mime }));
}

// Поток объекта: тело ответа S3 читается как Node-stream
export async function getObjectStream(id, key) {
  const { s3, cfg } = client(id);
  const res = await s3.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key }));
  return res.Body;
}
