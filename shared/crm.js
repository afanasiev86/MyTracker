// Общие справочники CRM для сервера и клиента

export const PROJECT_STATUSES = ['active', 'paused', 'done'];
export const PROJECT_STATUS_LABELS = {
  active: 'Активный',
  paused: 'На паузе',
  done: 'Завершён',
};

export const PRIORITIES = ['low', 'normal', 'high'];
export const PRIORITY_LABELS = {
  low: 'Низкий',
  normal: 'Обычный',
  high: 'Высокий',
};

export const RATE_KINDS = ['hourly', 'fixed'];
export const RATE_LABELS = {
  hourly: 'Почасовая',
  fixed: 'Фиксированная',
};

export const CURRENCIES = ['RUB', 'USD', 'EUR'];

// Slug проекта совпадает с полем project у задач и с именем папки репозитория
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
