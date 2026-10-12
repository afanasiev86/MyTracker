import { CLIENT_STATUS_LABELS } from '../../../../shared/statuses.js';

// Что видит заказчик о задаче. Внутреннего здесь нет: запуски, стоимость, diff, логи, прогресс.
export function toClientTask(task, projectName) {
  return {
    id: String(task._id),
    project: projectName,
    title: task.title,
    goal: task.goal,
    acceptance: task.acceptance,
    statusLabel: CLIENT_STATUS_LABELS[task.status] ?? '',
    dueDate: task.dueDate,
    updatedAt: task.updatedAt,
    // Свои комментарии заказчика и комментарии владельца, помеченные «Видно заказчику»
    comments: (task.comments || [])
      .filter((c) => c.author === 'client' || c.visibleToClient)
      .map((c) => ({ author: c.author === 'client' ? 'client' : 'owner', text: c.text, createdAt: c.createdAt })),
  };
}
