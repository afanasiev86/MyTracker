import { getChecks } from './getChecks.js';

// Публичный ответ: только признаки «работает/нет», без адресов, провайдеров и текстов ошибок
export async function getPublicHealth() {
  const { ok, mongo, claude, storage, telegram } = await getChecks();
  return {
    ok,
    checks: { mongo: mongo.ok, claude: claude.ok, storage: storage.ok, telegram: telegram.ok },
  };
}
