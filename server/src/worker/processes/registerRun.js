import { running } from './running.js';

export function registerRun(taskId, child) {
  running.set(String(taskId), { child, reason: null });
}
