import { telegramApi } from '../../services/telegram.js';
import { deliver } from './deliver.js';

// Нажатие inline-кнопки: Telegram ждёт ответа на callback, иначе кнопка «крутится»
export async function handleButton(query, onCallback) {
  if (String(query.from?.id) !== String(process.env.TELEGRAM_OWNER_ID)) return;
  await telegramApi('answerCallbackQuery', { callback_query_id: query.id }).catch(() => {});
  const reply = await onCallback(query.data).catch((err) => `Ошибка: ${err.message}`);
  await deliver(reply);
}
