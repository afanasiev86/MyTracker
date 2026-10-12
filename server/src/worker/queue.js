// Очередь на ключ (проект): задачи одного репозитория выполняются по одной,
// разные проекты работают параллельно.
const chains = new Map();

export function enqueue(key, job) {
  const prev = chains.get(key) ?? Promise.resolve();
  const next = prev
    .then(job)
    .catch((err) => console.error(`Очередь ${key}:`, err));
  chains.set(key, next);
  next.then(() => {
    if (chains.get(key) === next) chains.delete(key);
  });
  return next;
}
