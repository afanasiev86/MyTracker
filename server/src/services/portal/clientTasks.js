import Task from '../../models/Task.js';
import { toClientTask } from './toClientTask.js';
import { clientProjects } from './clientProjects.js';

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
