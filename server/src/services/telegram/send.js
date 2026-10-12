import { telegramApi } from './api.js';

// Отправка в любой чат (например, заказчику). extra может содержать reply_markup.
export function sendTelegramTo(chatId, text, extra = {}) {
  return telegramApi('sendMessage', {
    chat_id: chatId,
    text: text.slice(0, 4000),
    ...extra,
  });
}

// Сообщение владельцу. extra может содержать, например, reply_markup с кнопкой Mini App
export function sendTelegram(text, extra = {}) {
  return sendTelegramTo(process.env.TELEGRAM_OWNER_ID, text, extra);
}
