import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import { CLIENT_STATUS_LABELS } from '../../../shared/statuses.js';
import { notify } from './notify.js';

const COMMENT_MAX = 2000;

// Что видит заказчик о задаче. Внутреннего здесь нет: запуски, стоимость, diff, логи, прогресс.
export function toClientTask(task, projectName) {
  return {
    id: String(task._id),
    project: projectName,
    title: task.title,
    goal: task.goal,
    acceptance: task.acceptance,
    statusLabel: CLIENT_STATUS_LABELS[task.status] ?? '',
    dueDate: task.dueDate,
    updatedAt: task.updatedAt,
    // Свои комментарии заказчика и комментарии владельца, помеченные «Видно заказчику»
    comments: (task.comments || [])
      .filter((c) => c.author === 'client' || c.visibleToClient)
      .map((c) => ({ author: c.author === 'client' ? 'client' : 'owner', text: c.text, createdAt: c.createdAt })),
  };
}

async function clientProjects(clientId) {
  return Project.find({ client: clientId }).select('slug name').lean();
}

// Задачи проектов заказчика. Черновики (backlog) не показываем: это внутреннее планирование.
export async function clientTasks(clientId) {
  const projects = await clientProjects(clientId);
  if (projects.length === 0) return [];
  const names = new Map(projects.map((p) => [p.slug, p.name]));
  const tasks = await Task.find({ project: { $in: [...names.keys()] }, status: { $ne: 'backlog' } })
    .sort({ updatedAt: -1 })
    .lean();
  return tasks.map((t) => toClientTask(t, names.get(t.project)));
}

// Комментарий заказчика: только к задачам его проектов
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
