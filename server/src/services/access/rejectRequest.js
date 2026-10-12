import AccessRequest from '../../models/AccessRequest.js';
import { sendTelegramTo } from '../telegram.js';

// Отклонение запроса: заказчик получает сообщение, повторный /start не создаёт новый запрос
export async function rejectAccessRequest(requestId) {
  const request = await AccessRequest.findByIdAndUpdate(requestId, { $set: { status: 'rejected' } }).lean();
  if (!request) return { error: 'Запрос не найден', status: 404 };
  await sendTelegramTo(request.telegramId, 'Запрос отклонён. Если это ошибка, свяжитесь с исполнителем.')
    .catch((err) => console.error('Access notify:', err.message));
  return { ok: true };
}
