// Очередь на ключ (проект): задачи одного репозитория выполняются по одной,
// разные проекты работают параллельно. Внутри проекта раньше идут срочные задачи
// (priority high), затем обычные и низкие. При одинаковом приоритете порядок прежний (FIFO).
const RANK = { high: 0, normal: 1, low: 2 };

// key -> { items: [{ rank, seq, job, resolve }], running: boolean }
const queues = new Map();
let seq = 0;

export function rankOf(priority) {
  return RANK[priority] ?? RANK.normal;
}

export function enqueue(key, job, { priority = 'normal' } = {}) {
  let queue = queues.get(key);
  if (!queue) {
    queue = { items: [], running: false };
    queues.set(key, queue);
  }
  return new Promise((resolve) => {
    queue.items.push({ rank: rankOf(priority), seq: seq++, job, resolve });
    queue.items.sort((a, b) => a.rank - b.rank || a.seq - b.seq);
    drain(key);
  });
}

// Запускает следующее задание проекта, если сейчас ничего не выполняется
function drain(key) {
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

// Для тестов и диагностики: сколько заданий ждёт по проектам
export function queueSizes() {
  return Object.fromEntries([...queues].map(([key, q]) => [key, q.items.length + (q.running ? 1 : 0)]));
}
