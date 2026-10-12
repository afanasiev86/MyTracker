import { enqueue } from '../worker/queue.js';
import { runTask } from '../worker/runTask.js';
import { stopRun } from '../worker/processes.js';
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

// Ответ владельца на вопрос Claude: продолжаем ту же сессию
export async function answerTask(task, text) {
  if (task.status !== 'waiting') {
    return { error: 'Задача сейчас не ждёт ответа' };
  }
  task.comments.push({ author: 'owner', text: `Ответ: ${text}` });
  task.pendingQuestion = '';
  task.status = 'in_progress';
  await task.save();
  enqueue(task.project, () => runTask(task._id, { answer: text }));
  return { task };
}

// Отмена запуска. Если процесса уже нет (например, сервер перезапускали), сразу ставим ошибку.
export async function cancelTask(task) {
  if (task.status !== 'in_progress') {
    return { error: 'Отменить можно только задачу в работе' };
  }
  if (stopRun(task._id, 'cancelled')) {
    return { task, stopping: true };
  }
  task.status = 'failed';
  task.comments.push({ author: 'system', text: 'Запуск отменён вручную.' });
  await task.save();
  return { task, stopping: false };
}

// Приём результата проверки (кнопка «Принять» в Telegram и в интерфейсе)
export async function acceptTask(task) {
  if (task.status !== 'review') {
    return { error: 'Принять можно только задачу на проверке' };
  }
  task.status = 'done';
  await task.save();
  return { task };
}
