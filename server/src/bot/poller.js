import { telegramApi, sendTelegram, telegramEnabled } from '../services/telegram.js';

// Long polling: бот отвечает только владельцу (TELEGRAM_OWNER_ID)
export async function startPolling(handle) {
  if (!telegramEnabled()) {
    console.log('Telegram не настроен (TELEGRAM_BOT_TOKEN, TELEGRAM_OWNER_ID), бот не запущен');
    return;
  }

  let offset = 0;
  for (;;) {
    try {
      const updates = await telegramApi('getUpdates', { offset, timeout: 25 });
      for (const update of updates) {
        offset = update.update_id + 1;
        const msg = update.message;
        if (!msg?.text) continue;
        if (String(msg.from?.id) !== String(process.env.TELEGRAM_OWNER_ID)) continue;

        const reply = await handle(msg.text).catch((err) => `Ошибка: ${err.message}`);
        if (reply) await sendTelegram(reply);
      }
    } catch (err) {
      console.error('Telegram poll:', err.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}
