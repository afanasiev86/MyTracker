import Task from '../../models/Task.js';

// Дата из JSON приходит строкой: переводим в Date, пустую дату — в null
export function normalize(data) {
  const out = { ...data };
  if (out.deadline !== undefined) out.deadline = out.deadline ? new Date(out.deadline) : null;
  if (out.client === '') out.client = null;
  return out;
}

// Стоимость и количество задач по каждому проекту
export async function taskStats() {
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
