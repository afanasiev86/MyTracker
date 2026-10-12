import { running } from './running.js';

export function unregisterRun(taskId) {
  const entry = running.get(String(taskId));
  if (entry?.killTimer) clearTimeout(entry.killTimer);
  running.delete(String(taskId));
  return entry ?? null;
}
