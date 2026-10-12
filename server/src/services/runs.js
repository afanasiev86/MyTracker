import { enqueue } from '../worker/queue.js';
import { runTask } from '../worker/runTask.js';
import { RUNNABLE_FROM, STATUS_LABELS } from '../../../shared/statuses.js';

// Единая точка запуска задачи: используется и из API, и из Telegram-бота
export async function startTask(task) {
  if (!RUNNABLE_FROM.includes(task.status)) {
    return { error: `Из статуса «${STATUS_LABELS[task.status]}» запуск недоступен` };
  }
  if (task.status === 'failed') task.status = 'ready';
  task.status = 'in_progress';
  await task.save();
  enqueue(task.project, () => runTask(task._id));
  return { task };
}
