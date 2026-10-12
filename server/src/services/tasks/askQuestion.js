import { findTask } from '../store/tasks.js';
import { domainError } from '../errors.js';

// Claude задаёт вопрос во время работы. Вопрос виден владельцу как «Нужен ответ» после завершения запуска.
// Ошибки — DomainError (404, 409).
export async function askQuestion(id, text) {
  const task = await findTask(id);
  if (!task) throw domainError('not_found', 'Задача не найдена');
  if (task.status !== 'in_progress') {
    throw domainError('conflict', 'Вопрос можно задать только во время работы');
  }
  task.pendingQuestion = text;
  await task.save();
}
