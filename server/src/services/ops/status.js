import { opsAvailable } from './platform.js';
import { readMetrics } from './metrics.js';
import { listServices } from './services.js';
import { deployInfo } from './deploy.js';

// Всё, что показывает раздел «Сервер»: метрики, сервисы и состояние обновления
export async function getOpsStatus() {
  const available = opsAvailable();
  const [metrics, services, deploy] = await Promise.all([
    readMetrics(),
    listServices(),
    available ? deployInfo() : null,
  ]);
  return { available, metrics, services, deploy };
}
