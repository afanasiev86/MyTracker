import Task from '../../models/Task.js';
import Client from '../../models/Client.js';
import { notify } from '../notify.js';
import { clientProjects } from './clientProjects.js';

const COMMENT_MAX = 2000;

// Комментарий заказчика: только к задачам его проектов. Владелец получает уведомление.
export async function addClientComment(clientId, taskId, text) {
  const trimmed = String(text || '').trim().slice(0, COMMENT_MAX);
  const task = await Task.findById(taskId).select('title project status').lean();
  if (!task || task.status === 'backlog') return { notFound: true };
  const projects = await clientProjects(clientId);
  if (!projects.some((p) => p.slug === task.project)) return { notFound: true };

  await Task.updateOne(
    { _id: task._id },
    { $push: { comments: { author: 'client', text: trimmed, visibleToClient: true } } },
  );
  const client = await Client.findById(clientId).select('name').lean();
  await notify(`💬 ${client?.name ?? 'Заказчик'} в «${task.title}»:\n${trimmed.slice(0, 500)}\nID: ${task._id}`);
  return { ok: true };
}
