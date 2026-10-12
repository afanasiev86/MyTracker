import { running } from './running.js';

export function isRunning(taskId) {
  return running.has(String(taskId));
}
