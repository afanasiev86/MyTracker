import Settings from '../../models/Settings.js';
import { getConfig } from '../../config.js';
import { decryptSecret, encryptSecret } from '../telegram/secretBox.js';

// Токен GitHub: значение из интерфейса (база, зашифровано) важнее GITHUB_TOKEN из окружения.
// Держим его в памяти, чтобы остальной код читал токен синхронно.
let saved = { token: '', login: '' };

export const getGithubToken = () => saved.token || getConfig().github.token || '';

// Что сейчас задано (без токена: наружу он не отдаётся)
export function describeGithub() {
  const fromEnv = Boolean(getConfig().github.token);
  return {
    connected: Boolean(getGithubToken()),
    login: saved.token ? saved.login : '',
    source: saved.token ? 'ui' : (fromEnv ? 'env' : 'none'),
  };
}

export async function loadGithubSettings() {
  const doc = await Settings.findOne({ key: 'github' }).lean();
  const token = doc?.githubTokenEnc ? decryptSecret(doc.githubTokenEnc) : null;
  if (doc?.githubTokenEnc && !token) {
    console.warn('GitHub: сохранённый токен не расшифровался (изменился JWT_SECRET?), введите его заново в настройках');
  }
  saved = { token: token || '', login: doc?.githubLogin || '' };
}

export async function saveGithubSettings({ token, login }) {
  await Settings.updateOne(
    { key: 'github' },
    { $set: { githubTokenEnc: encryptSecret(token), githubLogin: login } },
    { upsert: true },
  );
  saved = { token, login };
}

export async function clearGithubSettings() {
  await Settings.updateOne({ key: 'github' }, { $set: { githubTokenEnc: '', githubLogin: '' } }, { upsert: true });
  saved = { token: '', login: '' };
}
