import { telegramApi } from '../../services/telegram/api.js';
import { deliver } from './deliver.js';
import { getTelegramConfig } from '../../services/telegram/runtime.js';

// Нажатие inline-кнопки: Telegram ждёт ответа на callback, иначе кнопка «крутится»
export async function handleButton(query, onCallback) {
  if (String(query.from?.id) !== String(getTelegramConfig().ownerId)) return;
  await telegramApi('answerCallbackQuery', { callback_query_id: query.id }).catch(() => {});
  const reply = await onCallback(query.data).catch((err) => `Ошибка: ${err.message}`);
  await deliver(reply);
}
