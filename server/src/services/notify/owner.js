import { sendTelegram, telegramEnabled } from '../telegram.js';

// Уведомления владельцу. Ошибки не ломают основной процесс, поэтому только логируются.
// extra — дополнительные поля Telegram, например reply_markup с кнопками.
export async function notify(text, extra = {}) {
  if (!telegramEnabled()) return;
  await sendTelegram(text, extra).catch((err) => console.error('Telegram:', err.message));
}
