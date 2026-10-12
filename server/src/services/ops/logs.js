import { domainError } from '../errors.js';
import { findService } from './catalog.js';
import { run } from './exec.js';
import { assertOpsAvailable } from './platform.js';
import { composeArgs } from './services.js';

export const DEFAULT_LINES = 50;
const MIN_LINES = 10;
const MAX_LINES = 200;

export function clampLines(value) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(MAX_LINES, Math.max(MIN_LINES, n)) : DEFAULT_LINES;
}

// Последние строки журнала сервиса из списка
export async function readLogs(id, lines = DEFAULT_LINES) {
  const svc = findService(id);
  if (!svc) throw domainError('not_found', 'Неизвестный сервис');
  assertOpsAvailable();
  const n = String(clampLines(lines));

  const res = svc.kind === 'systemd'
    ? await run('journalctl', ['-u', svc.unit, '-n', n, '--no-pager', '-o', 'short-iso'])
    : await run('docker', composeArgs('logs', '--no-color', '--tail', n, svc.service), { timeoutMs: 20000 });
  if (!res.ok) {
    const text = (res.stderr || res.error).trim().split('\n')[0];
    throw domainError('unavailable', `Не удалось прочитать журнал: ${text || 'нет доступа'}`);
  }
  // docker compose logs часть вывода пишет в stderr
  return `${res.stdout}${res.stderr}`.trim();
}
