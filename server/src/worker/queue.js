// Очередь на ключ (проект): задачи одного репозитория выполняются по одной,
// разные проекты работают параллельно. Внутри проекта раньше идут срочные задачи
// (priority high), затем обычные и низкие. При одинаковом приоритете порядок прежний (FIFO).
// Функции лежат в папке worker/queue/.
export { rankOf } from './queue/rank.js';
export { enqueue } from './queue/enqueue.js';
export { queueSizes } from './queue/queueSizes.js';
