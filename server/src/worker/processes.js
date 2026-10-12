// Реестр процессов Claude, которые сейчас работают. Нужен для отмены и таймаута.
const running = new Map(); // taskId -> { child, reason }

export function registerRun(taskId, child) {
  running.set(String(taskId), { child, reason: null });
}

export function unregisterRun(taskId) {
  const entry = running.get(String(taskId));
  running.delete(String(taskId));
  return entry ?? null;
}

export function isRunning(taskId) {
  return running.has(String(taskId));
}

// Останавливает процесс и запоминает причину ('cancelled' или 'timeout').
// Возвращает false, если процесса уже нет.
export function stopRun(taskId, reason) {
  const entry = running.get(String(taskId));
  if (!entry) return false;
  entry.reason = reason;
  entry.child.kill('SIGTERM');
  return true;
}
