import { sendTelegram, telegramEnabled } from './telegram.js';

// Уведомления не должны ломать основной процесс, поэтому ошибки только логируются
export async function notify(text) {
  if (!telegramEnabled()) return;
  await sendTelegram(text).catch((err) => console.error('Telegram:', err.message));
}
