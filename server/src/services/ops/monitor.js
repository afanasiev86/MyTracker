import { telegramEnabled } from '../telegram/api.js';
import { notify } from '../notify/owner.js';
import { opsAvailable } from './platform.js';
import { readMetrics } from './metrics.js';
import { listServices } from './services.js';
import { stoppedOnPurpose } from './control.js';

const CHECK_EVERY_MS = 60 * 1000;
export const DISK_LIMIT = 90;
export const MEMORY_LIMIT = 90;

// Текущие проблемы: ключ → описание. Сервисы без ответа (unknown) и запускающиеся не считаем, остановленные владельцем тоже.
export function findProblems({ metrics, services }, purposelyStopped = new Set()) {
  const problems = new Map();
  if (metrics.disk && metrics.disk.percent >= DISK_LIMIT) problems.set('disk', `диск заполнен на ${metrics.disk.percent}%`);
  if (metrics.memory.percent >= MEMORY_LIMIT) problems.set('memory', `занято ${metrics.memory.percent}% памяти`);
  for (const s of services) {
    const broken = s.status === 'inactive' || s.status === 'failed';
    if (broken && !purposelyStopped.has(s.id)) problems.set(`service:${s.id}`, `${s.label} не работает`);
  }
  return problems;
}

// Сообщения о том, что появилось и что исправилось с прошлой проверки
export function diffProblems(before, after) {
  const messages = [];
  for (const [key, text] of after) if (!before.has(key)) messages.push(`Проблема на сервере: ${text}.`);
  for (const [key, text] of before) if (!after.has(key)) messages.push(`Исправлено: ${text.replace(/ не работает$/, ' снова работает')}.`);
  return messages;
}

// Раз в минуту проверяет сервер и пишет владельцу, когда что-то сломалось или починилось
export function startOpsMonitor() {
  if (!opsAvailable()) return null;
  let known = new Map();
  const timer = setInterval(async () => {
    if (!telegramEnabled()) return;
    try {
      const [metrics, services] = await Promise.all([readMetrics(), listServices()]);
      const current = findProblems({ metrics, services }, stoppedOnPurpose);
      for (const message of diffProblems(known, current)) await notify(message);
      known = current;
    } catch (err) {
      console.error('Ops monitor:', err.message);
    }
  }, CHECK_EVERY_MS);
  timer.unref();
  return timer;
}
