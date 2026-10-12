import Task from '../../models/Task.js';
import { STATUS_LABELS } from '../../../../shared/statuses.js';

// /status: задачи, которые ждут внимания или работают
export async function statusCommand() {
  const tasks = await Task.find({ status: { $in: ['in_progress', 'waiting', 'review', 'ready'] } })
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();
  if (tasks.length === 0) return 'Активных задач нет.';
  return tasks
    .map((t) => `[${STATUS_LABELS[t.status]}] ${t.project}: ${t.title}\n${t._id}`)
    .join('\n\n');
}
