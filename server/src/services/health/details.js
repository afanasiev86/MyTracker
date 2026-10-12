import Task from '../../models/Task.js';
import { queueSizes } from '../../worker/queue.js';
import { runningTaskIds } from '../../worker/processes.js';
import { getChecks } from './getChecks.js';

const STARTED_AT = new Date();

// Подробности для владельца: воркер (очередь и запуски), сессии Claude, процесс
export async function getDetails() {
  const checks = await getChecks();
  const running = runningTaskIds();
  const [inProgress, waitingForAnswer] = await Promise.all([
    Task.find({ status: 'in_progress' }).select('_id').lean(),
    Task.countDocuments({ status: 'waiting' }),
  ]);
  // Задача «в работе», для которой нет процесса, — сессия потеряна (например, после перезапуска)
  const stale = inProgress.filter((t) => !running.includes(String(t._id))).length;
  return {
    checks,
    process: {
      startedAt: STARTED_AT,
      uptimeSec: Math.round(process.uptime()),
      rssMb: Math.round(process.memoryUsage().rss / 1048576),
    },
    worker: {
      // Сколько заданий стоит или выполняется по каждому проекту
      queues: queueSizes(),
      runningProcesses: running.length,
    },
    sessions: {
      inProgress: inProgress.length,
      waitingForAnswer,
      stale,
    },
  };
}
