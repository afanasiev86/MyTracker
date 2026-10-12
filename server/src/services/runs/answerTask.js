import { enqueueRun } from './enqueueRun.js';

// Ответ владельца на вопрос Claude: продолжаем ту же сессию
export async function answerTask(task, text) {
  if (task.status !== 'waiting') {
    return { error: 'Задача сейчас не ждёт ответа' };
  }
  task.comments.push({ author: 'owner', text: `Ответ: ${text}` });
  task.pendingQuestion = '';
  task.status = 'in_progress';
  task.queued = true;
  task.queuedAnswer = text;
  await task.save();
  enqueueRun(task, text);
  return { task };
}
