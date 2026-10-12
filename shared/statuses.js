// Общие правила статусов задач для сервера и клиента

export const TASK_STATUSES = ['backlog', 'ready', 'in_progress', 'review', 'done', 'failed'];

export const STATUS_LABELS = {
  backlog: 'Бэклог',
  ready: 'Готово к работе',
  in_progress: 'В работе',
  review: 'На проверке',
  done: 'Готово',
  failed: 'Ошибка',
};

// Ручные переходы. В статус in_progress задача попадает только через запуск.
export const TRANSITIONS = {
  backlog: ['ready'],
  ready: ['backlog'],
  in_progress: ['review', 'failed', 'ready'],
  review: ['done'],
  failed: ['ready', 'backlog'],
  done: [],
};

// Из каких статусов задачу можно отдать Claude
export const RUNNABLE_FROM = ['ready', 'review', 'failed'];

export function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

export function allowedTargets(from) {
  return TRANSITIONS[from] || [];
}
