import { getTelegramConfig } from './runtime.js';
// Минимальный клиент Telegram Bot API без внешних зависимостей

export function telegramEnabled() {
  return Boolean(getTelegramConfig().botToken && getTelegramConfig().ownerId);
}

// Один вызов метода Bot API. Ошибка Telegram превращается в исключение с описанием.
export async function telegramApi(method, body) {
  const url = `https://api.telegram.org/bot${getTelegramConfig().botToken}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`${method}: ${data.description}`);
  return data.result;
}
