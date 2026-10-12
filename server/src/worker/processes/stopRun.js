import { running } from './running.js';
import { KILL_AFTER_MS } from './config.js';

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
