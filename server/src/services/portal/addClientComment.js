import Task from '../../models/Task.js';
import Client from '../../models/Client.js';
import { notify } from '../notify.js';
import { clientProjects } from './clientProjects.js';
import { domainError } from '../errors.js';

const COMMENT_MAX = 2000;

// Комментарий заказчика: только к задачам его проектов. Владелец получает уведомление.
// Если задачи нет или она не видна заказчику, бросает DomainError (404).
export async function addClientComment(clientId, taskId, text) {
  const trimmed = String(text || '').trim().slice(0, COMMENT_MAX);
  const task = await Task.findById(taskId).select('title project status').lean();
  if (!task || task.status === 'backlog') throw domainError('not_found', 'Задача не найдена');
  const projects = await clientProjects(clientId);
  if (!projects.some((p) => p.slug === task.project)) throw domainError('not_found', 'Задача не найдена');

  await Task.updateOne(
    { _id: task._id },
    { $push: { comments: { author: 'client', text: trimmed, visibleToClient: true } } },
  );
  const client = await Client.findById(clientId).select('name').lean();
  await notify(`💬 ${client?.name ?? 'Заказчик'} в «${task.title}»:\n${trimmed.slice(0, 500)}\nID: ${task._id}`);
}
