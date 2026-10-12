import Settings from '../../models/Settings.js';
import { PROVIDERS, providerStatus } from './providers.js';

// Активный провайдер: выбор из базы, иначе из окружения, иначе MinIO
export async function getActiveProvider() {
  const doc = await Settings.findOne({ key: 'storage' }).lean();
  const chosen = doc?.provider || process.env.ATTACHMENT_STORAGE || 'minio';
  return PROVIDERS[chosen] ? chosen : 'minio';
}

// Сохраняет выбор, только если провайдер настроен в окружении
export async function setActiveProvider(id) {
  if (!PROVIDERS[id]) throw Object.assign(new Error('Неизвестное хранилище'), { status: 400 });
  if (!providerStatus(id).configured) {
    throw Object.assign(new Error(`${PROVIDERS[id].label} не настроен: заполните переменные окружения`), { status: 400 });
  }
  await Settings.updateOne({ key: 'storage' }, { $set: { provider: id } }, { upsert: true });
  return id;
}
