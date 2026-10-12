import { enqueue } from '../../worker/queue.js';
import { runTask } from '../../worker/runTask.js';

// Ответ владельца на вопрос Claude: продолжаем ту же сессию
export async function answerTask(task, text) {
  if (task.status !== 'waiting') {
    return { error: 'Задача сейчас не ждёт ответа' };
  }
  task.comments.push({ author: 'owner', text: `Ответ: ${text}` });
  task.pendingQuestion = '';
  task.status = 'in_progress';
  await task.save();
  enqueue(task.project, () => runTask(task._id, { answer: text }), { priority: task.priority });
  return { task };
}
