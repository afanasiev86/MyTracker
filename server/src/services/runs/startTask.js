import { enqueueRun } from './enqueueRun.js';
import { RUNNABLE_FROM, STATUS_LABELS } from '../../../../shared/statuses.js';

// Единая точка запуска задачи: используется и из API, и из Telegram-бота
export async function startTask(task) {
  if (!RUNNABLE_FROM.includes(task.status)) {
    return { error: `Из статуса «${STATUS_LABELS[task.status]}» запуск недоступен` };
  }
  task.status = 'in_progress';
  task.queued = true;
  task.queuedAnswer = '';
  await task.save();
  enqueueRun(task);
  return { task };
}
