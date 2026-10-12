import { HeadBucketCommand } from '@aws-sdk/client-s3';
import { providerStatus } from './providers.js';
import { s3For } from './s3Client.js';

// Проверка доступности для мониторинга. Не настроен — не ошибка (вложения просто не используются).
export async function probeProvider(id) {
  if (!providerStatus(id).configured) return { configured: false, reachable: false };
  const { s3, cfg } = s3For(id);
  try {
    await s3.send(new HeadBucketCommand({ Bucket: cfg.bucket }), { abortSignal: AbortSignal.timeout(5000) });
    return { configured: true, reachable: true };
  } catch (err) {
    return { configured: true, reachable: false, error: err.name || 'ошибка' };
  }
}
