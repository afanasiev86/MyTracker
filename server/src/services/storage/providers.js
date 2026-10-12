// Провайдеры хранилища вложений. Оба варианта говорят по протоколу S3.
// Секреты задаются только в переменных окружения, в базе хранится лишь выбранный провайдер.
import { getConfig } from '../../config.js';

export const PROVIDERS = {
  minio: { label: 'MinIO (свой сервер)' },
  s3: { label: 'S3 в облаке reg.ru' },
};

// Настройки провайдера из окружения. Для MinIO адрес собирается из хоста и порта.
export function providerConfig(id) {
  if (id === 'minio') {
    const m = getConfig().minio;
    return {
      endpoint: m.endpoint ? `${m.useSsl === 'true' ? 'https' : 'http'}://${m.endpoint}:${m.port || 9000}` : '',
      region: 'us-east-1',
      accessKeyId: m.accessKey || '',
      secretAccessKey: m.secretKey || '',
      bucket: m.bucket || 'mytracker-attachments',
    };
  }
  const s = getConfig().s3;
  return {
    endpoint: s.endpoint || '',
    region: s.region || 'us-east-1',
    accessKeyId: s.accessKey || '',
    secretAccessKey: s.secretKey || '',
    bucket: s.bucket || 'mytracker-attachments',
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
