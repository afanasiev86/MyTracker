import { getConfig } from '../../config.js';
// Минимальный клиент Telegram Bot API без внешних зависимостей

export function telegramEnabled() {
  return Boolean(getConfig().telegram.botToken && getConfig().telegram.ownerId);
}

// Один вызов метода Bot API. Ошибка Telegram превращается в исключение с описанием.
export async function telegramApi(method, body) {
  const url = `https://api.telegram.org/bot${getConfig().telegram.botToken}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`${method}: ${data.description}`);
  return data.result;
}
