import { findTask } from '../store/tasks.js';

// Claude задаёт вопрос во время работы. Вопрос виден владельцу как «Нужен ответ» после завершения запуска.
// Возвращает { notFound } | { error } | { ok }.
export async function askQuestion(id, text) {
  const task = await findTask(id);
  if (!task) return { notFound: true };
  if (task.status !== 'in_progress') {
    return { error: 'Вопрос можно задать только во время работы' };
  }
  task.pendingQuestion = text;
  await task.save();
  return { ok: true };
}
