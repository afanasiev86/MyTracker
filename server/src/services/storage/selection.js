import Settings from '../../models/Settings.js';
import { PROVIDERS, providerStatus } from './providers.js';
import { domainError } from '../errors.js';
import { getConfig } from '../../config.js';

// Активный провайдер: выбор из базы, иначе из окружения, иначе MinIO
export async function getActiveProvider() {
  const doc = await Settings.findOne({ key: 'storage' }).lean();
  const chosen = doc?.provider || getConfig().attachmentStorage || 'minio';
  return PROVIDERS[chosen] ? chosen : 'minio';
}

// Сохраняет выбор, только если провайдер настроен в окружении
export async function setActiveProvider(id) {
  if (!PROVIDERS[id]) throw domainError('invalid', 'Неизвестное хранилище');
  if (!providerStatus(id).configured) {
    throw domainError('invalid', `${PROVIDERS[id].label} не настроен: заполните переменные окружения`);
  }
  await Settings.updateOne({ key: 'storage' }, { $set: { provider: id } }, { upsert: true });
  return id;
}
