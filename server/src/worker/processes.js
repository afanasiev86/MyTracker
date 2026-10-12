// Реестр процессов Claude, которые сейчас работают. Нужен для отмены и таймаута.
// Функции лежат в папке worker/processes/.
export { registerRun } from './processes/registerRun.js';
export { unregisterRun } from './processes/unregisterRun.js';
export { isRunning } from './processes/isRunning.js';
export { runningTaskIds } from './processes/runningTaskIds.js';
export { stopRun } from './processes/stopRun.js';
