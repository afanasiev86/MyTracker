import { canTransition } from '../../../../shared/statuses.js';
import { findTask } from '../store/tasks.js';
import { assertProjectExists } from './assertProjectExists.js';
import { domainError } from '../errors.js';

// Правка полей задачи и ручной переход статуса. Статус «В работе» ставится только запуском.
// Возвращает задачу; ошибки — DomainError (404, 409).
export async function patchTask(id, patch) {
  const task = await findTask(id);
  if (!task) throw domainError('not_found', 'Задача не найдена');

  if (patch.project && patch.project !== task.project) {
    await assertProjectExists(patch.project);
  }

  if (patch.status && patch.status !== task.status) {
    if (patch.status === 'in_progress') {
      throw domainError('conflict', 'Статус «В работе» ставится только запуском задачи');
    }
    if (!canTransition(task.status, patch.status)) {
      throw domainError('conflict', `Нельзя перевести из «${task.status}» в «${patch.status}»`);
    }
  }

  Object.assign(task, patch);
  await task.save();
  return task.toObject();
}
