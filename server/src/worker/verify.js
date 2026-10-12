// Автопроверка после пуша: запуск test и lint из package.json проекта.
// Функции лежат в папке worker/verify/.
export { projectChecks } from './verify/projectChecks.js';
export { runChecks } from './verify/runChecks.js';
export { formatChecks } from './verify/formatChecks.js';
