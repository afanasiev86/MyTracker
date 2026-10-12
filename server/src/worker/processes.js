// Реестр процессов Claude, которые сейчас работают. Нужен для отмены и таймаута.
const KILL_AFTER_MS = 10 * 1000;
const running = new Map(); // taskId -> { child, reason }

export function registerRun(taskId, child) {
  running.set(String(taskId), { child, reason: null });
}

export function unregisterRun(taskId) {
  const entry = running.get(String(taskId));
  if (entry?.killTimer) clearTimeout(entry.killTimer);
  running.delete(String(taskId));
  return entry ?? null;
}

export function isRunning(taskId) {
  return running.has(String(taskId));
}

// ID задач, для которых сейчас работает процесс Claude
export function runningTaskIds() {
  return [...running.keys()];
}

// Останавливает процесс и запоминает причину ('cancelled' или 'timeout').
// Возвращает false, если процесса уже нет.
export function stopRun(taskId, reason) {
  const entry = running.get(String(taskId));
  if (!entry) return false;
  entry.reason = reason;
  entry.child.kill('SIGTERM');
  // Если процесс не завершился после SIGTERM, через паузу добиваем его SIGKILL
  entry.killTimer = setTimeout(() => {
    const { child } = entry;
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  }, KILL_AFTER_MS);
  entry.killTimer.unref();
  return true;
}
