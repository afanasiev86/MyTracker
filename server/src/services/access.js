import Client from '../models/Client.js';
import AccessRequest from '../models/AccessRequest.js';
import { sendTelegramTo } from './telegram.js';
import { notify } from './notify.js';

// Запрос доступа от человека, который написал боту /start. Повторный /start обновляет запрос.
export async function startAccessRequest(from) {
  const telegramId = String(from.id);
  if (telegramId === String(process.env.TELEGRAM_OWNER_ID)) return { reply: null };

  const linked = await Client.findOne({ telegramId }).select('name portalApproved').lean();
  if (linked?.portalApproved) {
    return { reply: 'Доступ уже подтверждён. Откройте трекер кнопкой «Трекер» внизу чата.' };
  }

  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Без имени';
  const username = from.username ? `@${from.username}` : '';
  const existing = await AccessRequest.findOne({ telegramId }).lean();
  if (existing?.status === 'rejected') {
    return { reply: 'Запрос отклонён. Если это ошибка, свяжитесь с исполнителем.' };
  }
  if (!existing) {
    await AccessRequest.create({ telegramId, name, username });
    await notify(`🔔 Новый запрос доступа к порталу: ${name} ${username}\nПодтвердите во вкладке «Клиенты».`);
  }
  return { reply: 'Запрос отправлен исполнителю. Когда доступ подтвердят, придёт сообщение.' };
}

export function listAccessRequests() {
  return AccessRequest.find({ status: 'pending' }).sort({ createdAt: 1 }).lean();
}

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

export async function rejectAccessRequest(requestId) {
  const request = await AccessRequest.findByIdAndUpdate(requestId, { $set: { status: 'rejected' } }).lean();
  if (!request) return { error: 'Запрос не найден', status: 404 };
  await sendTelegramTo(request.telegramId, 'Запрос отклонён. Если это ошибка, свяжитесь с исполнителем.')
    .catch((err) => console.error('Access notify:', err.message));
  return { ok: true };
}

// Закрыть портал клиенту: токены заказчика перестанут открывать его данные
export async function revokePortal(clientId) {
  const client = await Client.findByIdAndUpdate(
    clientId,
    { $unset: { telegramId: 1 }, $set: { portalApproved: false } },
    { new: true },
  ).lean();
  return Boolean(client);
}

// Проверка при каждом запросе портала: доступ могли закрыть уже после входа
export async function isPortalOpen(clientId) {
  const client = await Client.findById(clientId).select('portalApproved').lean();
  return Boolean(client?.portalApproved);
}
