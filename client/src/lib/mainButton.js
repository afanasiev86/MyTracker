import { RUNNABLE_FROM } from '../../../shared/statuses.js';

// Главная кнопка Telegram: одно самое полезное действие для текущего статуса
export function mainLabel(task) {
  if (RUNNABLE_FROM.includes(task.status)) {
    return task.status === 'review' ? 'Вернуть в работу' : 'Запустить в Claude';
  }
  if (task.status === 'review') return 'Принять результат';
  return '';
}
