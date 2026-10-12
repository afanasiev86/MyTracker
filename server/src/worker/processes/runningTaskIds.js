import { running } from './running.js';

// ID задач, для которых сейчас работает процесс Claude
export function runningTaskIds() {
  return [...running.keys()];
}
