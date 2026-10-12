import Client from '../../models/Client.js';
import AccessRequest from '../../models/AccessRequest.js';
import { sendTelegramTo } from '../telegram.js';

// Владелец подтверждает запрос и привязывает его к клиенту
export async function approveAccessRequest(requestId, clientId) {
  const request = await AccessRequest.findById(requestId).lean();
  if (!request) return { error: 'Запрос не найден', status: 404 };
  const client = await Client.findById(clientId).lean();
  if (!client) return { error: 'Клиент не найден', status: 404 };
  if (client.telegramId) return { error: 'У этого клиента уже подключён портал', status: 409 };

  try {
    await Client.updateOne(
      { _id: client._id },
      { $set: { telegramId: request.telegramId, portalApproved: true } },
    );
  } catch (err) {
    if (err.code === 11000) return { error: 'Этот Telegram уже привязан к другому клиенту', status: 409 };
    throw err;
  }
  await AccessRequest.deleteOne({ _id: request._id });
  await sendTelegramTo(request.telegramId, 'Доступ подтверждён. Откройте трекер кнопкой «Трекер» внизу чата: там ваши задачи.')
    .catch((err) => console.error('Access notify:', err.message));
  return { ok: true };
}
