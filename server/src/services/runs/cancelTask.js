import { stopRun } from '../../worker/processes.js';

// Отмена запуска. Если процесса уже нет (например, сервер перезапускали), сразу ставим ошибку.
export async function cancelTask(task) {
  if (task.status !== 'in_progress') {
    return { error: 'Отменить можно только задачу в работе' };
  }
  if (stopRun(task._id, 'cancelled')) {
    return { task, stopping: true };
  }
  task.status = 'failed';
  task.queued = false;
  task.queuedAnswer = '';
  task.comments.push({ author: 'system', text: 'Запуск отменён вручную.' });
  await task.save();
  return { task, stopping: false };
}
