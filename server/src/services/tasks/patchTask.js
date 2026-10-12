import { canTransition } from '../../../../shared/statuses.js';
import { findTask } from '../store/tasks.js';
import { assertProjectExists } from './assertProjectExists.js';

// Правка полей задачи и ручной переход статуса.
// Возвращает { notFound } | { error } | { task }. Статус «В работе» ставится только запуском.
export async function patchTask(id, patch) {
  const task = await findTask(id);
  if (!task) return { notFound: true };

  if (patch.project && patch.project !== task.project) {
    await assertProjectExists(patch.project);
  }

  if (patch.status && patch.status !== task.status) {
    if (patch.status === 'in_progress') {
      return { error: 'Статус «В работе» ставится только запуском задачи' };
    }
    if (!canTransition(task.status, patch.status)) {
      return { error: `Нельзя перевести из «${task.status}» в «${patch.status}»` };
    }
  }

  Object.assign(task, patch);
  await task.save();
  return { task: task.toObject() };
}
