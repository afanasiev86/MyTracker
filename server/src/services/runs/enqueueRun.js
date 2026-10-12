import { enqueue } from '../../worker/queue.js';
import { runTask } from '../../worker/runTask.js';

// Ставит запуск в очередь проекта с приоритетом задачи. Очередь в памяти, поэтому состояние
// «ждёт в очереди» хранится и в задаче (queued), см. recoverRuns.
export function enqueueRun(task, answer = null) {
  return enqueue(task.project, () => runTask(task._id, { answer }), { priority: task.priority });
}
