// Уведомления заказчику о смене видимого статуса его задачи.
import Project from '../../models/Project.js';
import Client from '../../models/Client.js';
import { CLIENT_STATUS_LABELS } from '../../../../shared/statuses.js';
import { sendTelegramTo } from '../telegram/send.js';
import { telegramEnabled } from '../telegram/api.js';

// Текст для заказчика: название задачи, проект и видимый ему статус. Внутренние детали не пишем.
export function clientStatusMessage(title, projectName, status) {
  return `Задача «${title}» (${projectName}): ${CLIENT_STATUS_LABELS[status]}.\nПодробности в портале, кнопка «Трекер» внизу чата.`;
}

// Сообщаем, только если изменилась видимая заказчику часть статуса.
// Черновик (backlog) заказчику не показываем, поэтому переход в него или из одинаковых подписей не даёт сообщения.
export function shouldNotifyClient(from, to) {
  if (to === 'backlog' || !CLIENT_STATUS_LABELS[to]) return false;
  return CLIENT_STATUS_LABELS[from] !== CLIENT_STATUS_LABELS[to];
}

// Вызывается при смене статуса задачи (подписка в models/Task.js).
// Сообщение уходит только заказчику с подтверждённым доступом и известным Telegram.
export async function notifyClientOfStatusChange(task, from) {
  if (!telegramEnabled() || !shouldNotifyClient(from, task.status)) return;
  const project = await Project.findOne({ slug: task.project }).select('name client').lean();
  if (!project?.client) return;
  const client = await Client.findById(project.client).select('telegramId portalApproved').lean();
  if (!client?.portalApproved || !client.telegramId) return;
  await sendTelegramTo(client.telegramId, clientStatusMessage(task.title, project.name, task.status));
}
