// Общие правила статусов задач для сервера и клиента

export const TASK_STATUSES = [
  'backlog',
  'ready',
  'in_progress',
  'waiting',
  'review',
  'done',
  'failed',
];

export const STATUS_LABELS = {
  backlog: 'Бэклог',
  ready: 'Готово к работе',
  in_progress: 'В работе',
  waiting: 'Нужен ответ',
  review: 'На проверке',
  done: 'Принято',
  failed: 'Ошибка',
};

// Ручные переходы. В статусы in_progress и waiting задача попадает только работой воркера.
export const TRANSITIONS = {
  backlog: ['ready'],
  ready: ['backlog'],
  in_progress: [],
  waiting: ['backlog'],
  review: ['done'],
  failed: ['ready', 'backlog'],
  done: [],
};

// Из каких статусов задачу можно отдать Claude
export const RUNNABLE_FROM = ['ready', 'review', 'failed'];

// Статусы, в которых задача ждёт вашего ответа или проверки
export const NEEDS_ATTENTION = ['waiting', 'review', 'failed'];

export function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

export function allowedTargets(from) {
  return TRANSITIONS[from] || [];
}

// Подписи статусов для заказчика: без внутренних деталей (запуски, вопросы Claude и т. п.)
export const CLIENT_STATUS_LABELS = {
  backlog: 'Запланировано',
  ready: 'В очереди',
  in_progress: 'В работе',
  waiting: 'Уточняем детали',
  review: 'На проверке',
  done: 'Принято',
  failed: 'Требует внимания',
};
