import { telegramApi, sendTelegram, telegramEnabled } from '../services/telegram.js';

// Кнопка меню бота открывает Mini App (нужен HTTPS-адрес в TELEGRAM_MINIAPP_URL)
async function setMenuButton() {
  const url = process.env.TELEGRAM_MINIAPP_URL;
  if (!url) return;
  await telegramApi('setChatMenuButton', {
    chat_id: process.env.TELEGRAM_OWNER_ID,
    menu_button: { type: 'web_app', text: 'Трекер', web_app: { url } },
  }).catch((err) => console.error('Menu button:', err.message));
}

async function deliver(reply) {
  if (!reply) return;
  if (typeof reply === 'string') return sendTelegram(reply);
  return sendTelegram(reply.text, { reply_markup: reply.reply_markup });
}

// Long polling: бот отвечает только владельцу (TELEGRAM_OWNER_ID)
export async function startPolling(handle) {
  if (!telegramEnabled()) {
    console.log('Telegram не настроен (TELEGRAM_BOT_TOKEN, TELEGRAM_OWNER_ID), бот не запущен');
    return;
  }

  await setMenuButton();

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
        await deliver(reply);
      }
    } catch (err) {
      console.error('Telegram poll:', err.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}
