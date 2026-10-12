import Client from '../../models/Client.js';
import AccessRequest from '../../models/AccessRequest.js';
import { notify } from '../notify.js';
import { getConfig } from '../../config.js';

// Запрос доступа от человека, который написал боту /start. Повторный /start обновляет запрос.
export async function startAccessRequest(from) {
  const telegramId = String(from.id);
  if (telegramId === String(getConfig().telegram.ownerId)) return { reply: null };

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
