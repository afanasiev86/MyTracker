import Settings from '../../models/Settings.js';
import { getConfig } from '../../config.js';
import { decryptSecret, encryptSecret } from './secretBox.js';

// Настройки Telegram: значения из интерфейса (база) важнее переменных окружения.
// Держим их в памяти, чтобы остальной код читал настройки синхронно, как раньше читал getConfig().
let saved = { botToken: '', ownerId: '', miniAppUrl: '', botUsername: '' };

export function getTelegramConfig() {
  const env = getConfig().telegram;
  return {
    botToken: saved.botToken || env.botToken,
    ownerId: saved.ownerId || env.ownerId,
    miniAppUrl: saved.miniAppUrl || env.miniAppUrl,
  };
}

// Что сейчас задано в интерфейсе (без токена: наружу он не отдаётся)
export function describeTelegram() {
  const env = getConfig().telegram;
  const effective = getTelegramConfig();
  const fromUi = Boolean(saved.botToken || saved.ownerId || saved.miniAppUrl);
  return {
    connected: Boolean(effective.botToken && effective.ownerId),
    hasToken: Boolean(effective.botToken),
    ownerId: effective.ownerId || '',
    miniAppUrl: effective.miniAppUrl || '',
    botUsername: saved.botToken ? saved.botUsername : '',
    source: fromUi ? 'ui' : (env.botToken || env.ownerId ? 'env' : 'none'),
  };
}

export async function loadTelegramSettings() {
  const doc = await Settings.findOne({ key: 'telegram' }).lean();
  const botToken = doc?.telegramTokenEnc ? decryptSecret(doc.telegramTokenEnc) : null;
  if (doc?.telegramTokenEnc && !botToken) {
    console.warn('Telegram: сохранённый токен не расшифровался (изменился JWT_SECRET?), введите его заново в настройках');
  }
  saved = {
    botToken: botToken || '',
    ownerId: doc?.telegramOwnerId || '',
    miniAppUrl: doc?.telegramMiniAppUrl || '',
    botUsername: doc?.telegramBotUsername || '',
  };
}

export async function saveTelegramSettings({ botToken, ownerId, miniAppUrl, botUsername }) {
  await Settings.updateOne(
    { key: 'telegram' },
    {
      $set: {
        telegramTokenEnc: encryptSecret(botToken),
        telegramOwnerId: ownerId,
        telegramMiniAppUrl: miniAppUrl,
        telegramBotUsername: botUsername,
      },
    },
    { upsert: true },
  );
  saved = { botToken, ownerId, miniAppUrl, botUsername };
}

export async function clearTelegramSettings() {
  await Settings.updateOne(
    { key: 'telegram' },
    { $set: { telegramTokenEnc: '', telegramOwnerId: '', telegramMiniAppUrl: '', telegramBotUsername: '' } },
    { upsert: true },
  );
  saved = { botToken: '', ownerId: '', miniAppUrl: '', botUsername: '' };
}
