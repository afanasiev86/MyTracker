import Task from '../../models/Task.js';

// Доступ к задачам в базе. Маршруты и сервисы работают с задачами только через эти функции.
export function findTask(id) {
  return Task.findById(id);
}

export function findTaskLean(id) {
  return Task.findById(id).lean();
}

export function listTasks(filter) {
  return Task.find(filter).sort({ updatedAt: -1 }).select('-runs.log').lean();
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
