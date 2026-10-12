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

// Нажатие inline-кнопки: Telegram ждёт ответа на callback, иначе кнопка «крутится»
async function handleButton(query, onCallback) {
  if (String(query.from?.id) !== String(process.env.TELEGRAM_OWNER_ID)) return;
  await telegramApi('answerCallbackQuery', { callback_query_id: query.id }).catch(() => {});
  const reply = await onCallback(query.data).catch((err) => `Ошибка: ${err.message}`);
  await deliver(reply);
}

// Long polling: бот отвечает только владельцу (TELEGRAM_OWNER_ID)
export async function startPolling(handle, onCallback = async () => 'Кнопка не поддерживается') {
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

        if (update.callback_query) {
          await handleButton(update.callback_query, onCallback);
          continue;
        }

        const msg = update.message;
        if (!msg?.text) continue;
        if (String(msg.from?.id) !== String(process.env.TELEGRAM_OWNER_ID)) continue;

        const replyToText = msg.reply_to_message?.text || '';
        const reply = await handle(msg.text, replyToText).catch((err) => `Ошибка: ${err.message}`);
        await deliver(reply);
      }
    } catch (err) {
      console.error('Telegram poll:', err.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}
