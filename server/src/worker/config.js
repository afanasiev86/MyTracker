import { getConfig } from '../config.js';

// Настройки воркера: берутся из общей конфигурации
export function workerConfig() {
  const w = getConfig().worker;
  return {
    reposDir: w.reposDir,
    claudeBin: w.claudeBin,
    apiUrl: w.apiUrl,
    timeoutMin: w.timeoutMin,
  };
}
