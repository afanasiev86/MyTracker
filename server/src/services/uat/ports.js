import { domainError } from '../errors.js';

// Диапазон совпадает с проверкой в deploy/uat-expose.sh
export const PORT_MIN = 4100;
export const PORT_MAX = 4999;

// Наименьший свободный порт стенда
export function pickPort(used) {
  const taken = new Set(used);
  for (let port = PORT_MIN; port <= PORT_MAX; port += 1) {
    if (!taken.has(port)) return port;
  }
  throw domainError('unavailable', 'Закончились свободные порты для UAT-стендов');
}
