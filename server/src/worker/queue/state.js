// key -> { items: [{ rank, seq, job, resolve }], running: boolean }
export const queues = new Map();

let seq = 0;

// Порядковый номер задачи: при одинаковом приоритете сохраняется порядок постановки (FIFO)
export function nextSeq() {
  return seq++;
}
