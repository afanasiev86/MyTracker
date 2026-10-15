import { clearClaudeSettings, describeClaude, saveClaudeSettings } from './settings.js';

// Подключение из настроек: в отличие от GitHub, у Anthropic нет общего «whoami» для API-ключа или
// долгоживущего OAuth-токена (claude setup-token), поэтому аккаунт подписывает сам владелец произвольной
// меткой — токен не проверяется запросом к сети, только сохраняется.
export async function connectClaude({ token, type, label }) {
  await saveClaudeSettings({ token, type, label });
  return describeClaude();
}

// Отключение: воркер возвращается к аккаунту, залогиненному на сервере (как до подключения).
export async function disconnectClaude() {
  await clearClaudeSettings();
  return describeClaude();
}
