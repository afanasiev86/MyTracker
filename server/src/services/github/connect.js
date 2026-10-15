import { githubRequest } from './api.js';
import { clearGithubSettings, describeGithub, saveGithubSettings } from './settings.js';

// Подключение из настроек: токен проверяется запросом к GitHub до сохранения, заодно узнаём логин аккаунта.
// Ошибки — DomainError (invalid для отвергнутого токена, unavailable при проблемах связи).
export async function connectGithub(token) {
  const user = await githubRequest('GET', '/user', undefined, token);
  await saveGithubSettings({ token, login: user.login });
  return describeGithub();
}

// Отключение: убирает токен из интерфейса. Если GITHUB_TOKEN задан ещё и в окружении, синхронизация продолжится с ним.
export async function disconnectGithub() {
  await clearGithubSettings();
  return describeGithub();
}
