import Settings from '../../models/Settings.js';
import { decryptSecret, encryptSecret } from '../telegram/secretBox.js';

// Аккаунт Claude: значение из интерфейса (база, зашифровано). Нет отдельного GITHUB_TOKEN-подобного запасного
// варианта из окружения — без сохранённого аккаунта воркер запускает claude так же, как раньше (аккаунт сервера).
// Держим его в памяти, чтобы остальной код читал синхронно.
let saved = { token: '', type: '', label: '' };

export const getClaudeCredential = () => (saved.token ? { token: saved.token, type: saved.type } : null);

// Что сейчас задано (без токена: наружу он не отдаётся)
export function describeClaude() {
  return {
    connected: Boolean(saved.token),
    label: saved.label,
    type: saved.type,
  };
}

export async function loadClaudeSettings() {
  const doc = await Settings.findOne({ key: 'claude' }).lean();
  const token = doc?.claudeTokenEnc ? decryptSecret(doc.claudeTokenEnc) : null;
  if (doc?.claudeTokenEnc && !token) {
    console.warn('Claude: сохранённый токен не расшифровался (изменился JWT_SECRET?), подключите аккаунт заново в настройках');
  }
  saved = { token: token || '', type: token ? doc.claudeTokenType : '', label: token ? doc.claudeAccountLabel : '' };
}

export async function saveClaudeSettings({ token, type, label }) {
  await Settings.updateOne(
    { key: 'claude' },
    { $set: { claudeTokenEnc: encryptSecret(token), claudeTokenType: type, claudeAccountLabel: label } },
    { upsert: true },
  );
  saved = { token, type, label };
}

export async function clearClaudeSettings() {
  await Settings.updateOne(
    { key: 'claude' },
    { $set: { claudeTokenEnc: '', claudeTokenType: '', claudeAccountLabel: '' } },
    { upsert: true },
  );
  saved = { token: '', type: '', label: '' };
}
