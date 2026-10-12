import { queues, nextSeq } from './state.js';
import { rankOf } from './rank.js';
import { drain } from './drain.js';

// Ставит задание в очередь проекта. Промис резолвится, когда задание завершено.
export function enqueue(key, job, { priority = 'normal' } = {}) {
  let queue = queues.get(key);
  if (!queue) {
    queue = { items: [], running: false };
    queues.set(key, queue);
  }
  return new Promise((resolve) => {
    queue.items.push({ rank: rankOf(priority), seq: nextSeq(), job, resolve });
    queue.items.sort((a, b) => a.rank - b.rank || a.seq - b.seq);
    drain(key);
  });
}
