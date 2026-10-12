import { canTransition, STATUS_LABELS } from '../../../../shared/statuses.js';
import { startTask } from '../../services/runs/startTask.js';
import { findTask } from './findTask.js';

// /ready <id> — перевести в «Готово к работе»; /run <id> — сразу запустить в Claude
export async function readyRunCommand(cmd, args) {
  const [id] = args;
  if (!id) return `Формат: ${cmd} <id>`;
  const task = await findTask(id);
  if (!task) return 'Задача не найдена';

  if (cmd === '/ready') {
    if (task.status === 'ready') return 'Задача уже готова к работе';
    if (!canTransition(task.status, 'ready')) {
      return `Из статуса «${STATUS_LABELS[task.status]}» нельзя перевести в «Готово к работе»`;
    }
    task.status = 'ready';
    await task.save();
    return `Задача ${id} готова к работе. Запуск: /run ${id}`;
  }

  const result = await startTask(task);
  return result.error ?? `Задача ${id} запущена в Claude. Уведомление придёт по завершении.`;
}
