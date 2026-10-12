import { answerTask } from '../../services/runs.js';
import { findTask } from './findTask.js';

// Ответ владельца на вопрос Claude по ID задачи (через /answer или ответом на сообщение)
export async function answerById(id, text) {
  const task = await findTask(id);
  if (!task) return 'Задача не найдена';
  const result = await answerTask(task, text);
  return result.error ?? `Ответ принят, Claude продолжает задачу ${id}.`;
}
