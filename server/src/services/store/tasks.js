import Task from '../../models/Task.js';
import { sortByOrder } from '../../../../shared/taskOrder.js';

// Доступ к задачам в базе. Маршруты и сервисы работают с задачами только через эти функции.
export function findTask(id) {
  return Task.findById(id);
}

export function findTaskLean(id) {
  return Task.findById(id).lean();
}

// Новее выше, затем ручная сортировка с доски (sort в JS стабилен, порядок по updatedAt остаётся для равных)
export async function listTasks(filter) {
  const tasks = await Task.find(filter).sort({ updatedAt: -1 }).select('-runs.log').lean();
  return sortByOrder(tasks);
}

export function listProjectTasks(slug) {
  return Task.find({ project: slug }).sort({ updatedAt: -1 }).select('-runs.log').lean();
}

export function createTask(data) {
  return Task.create(data);
}

export function addTaskComment(id, comment) {
  return Task.findByIdAndUpdate(id, { $push: { comments: comment } }, { new: true }).lean();
}

// Задачи, у которых запуск отмечен как выполняемый (нужно при восстановлении после перезапуска)
export function listInProgressTasks() {
  return Task.find({ status: 'in_progress' });
}

// Запуск, прерванный перезапуском сервера: ставим ошибку без хуков сохранения (уведомлений не шлём, как и раньше)
export function failInterruptedRun(id, comment) {
  return Task.updateOne(
    { _id: id },
    {
      $set: { status: 'failed', queued: false, queuedAnswer: '' },
      $push: { comments: comment },
    },
  );
}

export function taskExistsInProject(slug) {
  return Task.exists({ project: slug });
}

// Количество задач, открытых и стоимость запусков по каждому проекту
export async function taskStatsByProject() {
  const rows = await Task.aggregate([
    {
      $group: {
        _id: '$project',
        tasks: { $sum: 1 },
        open: { $sum: { $cond: [{ $ne: ['$status', 'done'] }, 1, 0] } },
        runs: { $push: '$runs' },
      },
    },
  ]);
  return Object.fromEntries(rows.map((r) => {
    const costUsd = r.runs.flat().reduce((sum, run) => sum + (run.costUsd || 0), 0);
    return [r._id, { tasks: r.tasks, open: r.open, costUsd }];
  }));
}

// Суммарная стоимость запусков по проектам и число запусков
export async function runCostsByProject() {
  const rows = await Task.aggregate([
    { $unwind: '$runs' },
    {
      $group: {
        _id: '$project',
        costUsd: { $sum: '$runs.costUsd' },
        runs: { $sum: 1 },
      },
    },
    { $sort: { costUsd: -1 } },
  ]);
  return rows.map((r) => ({ project: r._id, costUsd: r.costUsd, runs: r.runs }));
}
