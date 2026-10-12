import { queues } from './state.js';

// Для тестов и диагностики: сколько заданий ждёт по проектам
export function queueSizes() {
  return Object.fromEntries([...queues].map(([key, q]) => [key, q.items.length + (q.running ? 1 : 0)]));
}
