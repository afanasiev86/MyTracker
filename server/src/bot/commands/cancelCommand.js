import { cancelTask } from '../../services/runs/cancelTask.js';
import { findTask } from './findTask.js';

// /cancel <id>: остановить запуск, который идёт
export async function cancelCommand(args) {
  const [id] = args;
  if (!id) return 'Формат: /cancel <id>';
  const task = await findTask(id);
  if (!task) return 'Задача не найдена';
  const result = await cancelTask(task);
  if (result.error) return result.error;
  return result.stopping ? `Останавливаю задачу ${id}…` : `Задача ${id} переведена в «Ошибка»`;
}
