import { enqueueRun } from './enqueueRun.js';
import { buildFixPrompt } from './fixPrompt.js';

// Просьба исправить упавшую задачу. Claude получает причину сбоя (итог и конец лога последнего запуска)
// и подсказку владельца; продолжает ту же сессию, если она сохранилась, иначе начинает заново в той же ветке.
export async function fixTask(task, hint = '') {
  if (task.status !== 'failed') {
    return { error: 'Исправлять можно только задачу в статусе «Ошибка»' };
  }
  const note = String(hint || '').trim();
  const last = task.runs.at(-1);
  const message = buildFixPrompt({ summary: last?.summary, log: last?.log, hint: note });
  task.comments.push({
    author: 'owner',
    text: note ? `Исправить ошибку: ${note}` : 'Попросил Claude исправить ошибку.',
  });
  task.status = 'in_progress';
  task.queued = true;
  task.queuedAnswer = message;
  await task.save();
  enqueueRun(task, message);
  return { task };
}
