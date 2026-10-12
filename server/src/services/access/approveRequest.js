import Client from '../../models/Client.js';
import AccessRequest from '../../models/AccessRequest.js';
import { sendTelegramTo } from '../telegram.js';
import { domainError } from '../errors.js';

// Владелец подтверждает запрос и привязывает его к клиенту. Ошибки — DomainError (404, 409).
export async function approveAccessRequest(requestId, clientId) {
  const request = await AccessRequest.findById(requestId).lean();
  if (!request) throw domainError('not_found', 'Запрос не найден');
  const client = await Client.findById(clientId).lean();
  if (!client) throw domainError('not_found', 'Клиент не найден');
  if (client.telegramId) throw domainError('conflict', 'У этого клиента уже подключён портал');

  try {
    await Client.updateOne(
      { _id: client._id },
      { $set: { telegramId: request.telegramId, portalApproved: true } },
    );
  } catch (err) {
    if (err.code === 11000) throw domainError('conflict', 'Этот Telegram уже привязан к другому клиенту');
    throw err;
  }
  await AccessRequest.deleteOne({ _id: request._id });
  await sendTelegramTo(request.telegramId, 'Доступ подтверждён. Откройте трекер кнопкой «Трекер» внизу чата: там ваши задачи.')
    .catch((err) => console.error('Access notify:', err.message));
}
