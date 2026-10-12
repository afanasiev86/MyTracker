import { domainError } from '../errors.js';

// Управление сервисами, журналы и деплой работают только на Linux-сервере (systemd, docker).
// Метрики (нагрузка, память, диск) доступны везде.
export const opsAvailable = () => process.platform === 'linux';

export function assertOpsAvailable() {
  if (!opsAvailable()) {
    throw domainError('unavailable', 'Управление сервисами доступно только на Linux-сервере с systemd');
  }
}
