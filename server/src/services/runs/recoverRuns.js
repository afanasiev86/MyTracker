import { listInProgressTasks, failInterruptedRun } from '../store/tasks.js';
import { enqueueRun } from './enqueueRun.js';

const defaultDeps = { listInProgressTasks, failInterruptedRun, enqueueRun };

// Восстановление после перезапуска сервера. Очередь и процессы в памяти теряются, поэтому:
// - запуск, который ждал в очереди (queued), ставим обратно вместе с ответом владельца;
// - запуск, который выполнялся, помечаем ошибкой: процесс Claude уже не существует.
// Возвращает количество возвращённых в очередь и помеченных ошибкой запусков.
export async function recoverRuns(deps = defaultDeps) {
  const tasks = await deps.listInProgressTasks();
  let resumed = 0;
  let failed = 0;
  for (const task of tasks) {
    if (task.queued) {
      deps.enqueueRun(task, task.queuedAnswer || null);
      resumed += 1;
    } else {
      await deps.failInterruptedRun(task._id, {
        author: 'system',
        text: 'Сервер перезапущен во время работы. Запустите задачу заново.',
      });
      failed += 1;
    }
  }
  return { resumed, failed };
}
