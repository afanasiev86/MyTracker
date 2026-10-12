import { mongoCheck } from './mongoCheck.js';
import { claudeCheck } from './claudeCheck.js';
import { storageCheck } from './storageCheck.js';
import { telegramCheck } from './telegramCheck.js';

// Результаты проверок кэшируются на CACHE_MS, чтобы частые опросы не нагружали Telegram и хранилище
const CACHE_MS = 30 * 1000;
let cache = null;

// Все проверки разом. Результат кэшируется, если не запрошено свежее.
export async function getChecks({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const [mongo, claude, storage, telegram] = await Promise.all([
    mongoCheck(),
    claudeCheck(),
    storageCheck(),
    telegramCheck(),
  ]);
  const value = {
    ok: mongo.ok && claude.ok && storage.ok && telegram.ok,
    mongo,
    claude,
    storage,
    telegram,
  };
  cache = { at: Date.now(), value };
  return value;
}

// Для тестов: сбрасывает кэш проверок
export function resetHealthCache() {
  cache = null;
}
