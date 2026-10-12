import { sendTelegram, telegramEnabled } from './telegram.js';

// Уведомления не должны ломать основной процесс, поэтому ошибки только логируются.
// extra — дополнительные поля Telegram, например reply_markup с кнопками.
export async function notify(text, extra = {}) {
  if (!telegramEnabled()) return;
  await sendTelegram(text, extra).catch((err) => console.error('Telegram:', err.message));
}
