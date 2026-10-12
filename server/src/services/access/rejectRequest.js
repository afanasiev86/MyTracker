import AccessRequest from '../../models/AccessRequest.js';
import { sendTelegramTo } from '../telegram.js';
import { domainError } from '../errors.js';

// Отклонение запроса: заказчик получает сообщение, повторный /start не создаёт новый запрос. Ошибка — DomainError (404).
export async function rejectAccessRequest(requestId) {
  const request = await AccessRequest.findByIdAndUpdate(requestId, { $set: { status: 'rejected' } }).lean();
  if (!request) throw domainError('not_found', 'Запрос не найден');
  await sendTelegramTo(request.telegramId, 'Запрос отклонён. Если это ошибка, свяжитесь с исполнителем.')
    .catch((err) => console.error('Access notify:', err.message));
}
