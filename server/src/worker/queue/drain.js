import { queues } from './state.js';

// Запускает следующее задание проекта, если сейчас ничего не выполняется
export function drain(key) {
  const queue = queues.get(key);
  if (!queue || queue.running) return;
  const next = queue.items.shift();
  if (!next) {
    queues.delete(key);
    return;
  }
  queue.running = true;
  Promise.resolve()
    .then(next.job)
    .catch((err) => console.error(`Очередь ${key}:`, err))
    .finally(() => {
      queue.running = false;
      next.resolve();
      drain(key);
    });
}
