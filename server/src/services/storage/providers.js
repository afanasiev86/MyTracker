// Провайдеры хранилища вложений. Оба варианта говорят по протоколу S3.
// Секреты задаются только в переменных окружения, в базе хранится лишь выбранный провайдер.
export const PROVIDERS = {
  minio: { label: 'MinIO (свой сервер)' },
  s3: { label: 'S3 в облаке reg.ru' },
};

// Настройки провайдера из окружения. Для MinIO адрес собирается из хоста и порта.
export function providerConfig(id) {
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

export function isConfigured(cfg) {
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
