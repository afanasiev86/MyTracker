// Минимальный клиент Telegram Bot API без внешних зависимостей

export function telegramEnabled() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_OWNER_ID);
}

export async function telegramApi(method, body) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`${method}: ${data.description}`);
  return data.result;
}

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
