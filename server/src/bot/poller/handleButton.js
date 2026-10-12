import { telegramApi } from '../../services/telegram.js';
import { deliver } from './deliver.js';
import { getConfig } from '../../config.js';

// Нажатие inline-кнопки: Telegram ждёт ответа на callback, иначе кнопка «крутится»
export async function handleButton(query, onCallback) {
  if (String(query.from?.id) !== String(getConfig().telegram.ownerId)) return;
  await telegramApi('answerCallbackQuery', { callback_query_id: query.id }).catch(() => {});
  const reply = await onCallback(query.data).catch((err) => `Ошибка: ${err.message}`);
  await deliver(reply);
}
