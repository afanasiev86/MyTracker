import { getConfig } from '../../config.js';
import { domainError } from '../errors.js';
import { run } from '../ops/exec.js';
import { assertOpsAvailable } from '../ops/platform.js';
import { listStandPorts, saveStandPort } from '../store/projects.js';
import { pickPort } from './ports.js';
import { standHost } from './standHost.js';

// Копия deploy/uat-expose.sh, принадлежит root (ставится deploy/uat-setup.sh)
const EXPOSE_BIN = '/usr/local/sbin/uat-expose';
// Первый стенд ждёт выпуска сертификата Let's Encrypt
const EXPOSE_TIMEOUT_MS = 3 * 60 * 1000;

// Порты выдаются по одному за раз: иначе два проекта получили бы один и тот же порт
let turn = Promise.resolve();

async function ensure(slug) {
  const host = standHost(slug, getConfig().uat.domain);
  assertOpsAvailable();

  const projects = await listStandPorts();
  const own = projects.find((p) => p.slug === slug);
  if (!own) throw domainError('not_found', 'Проект не найден');
  const port = own.uatPort ?? pickPort(projects.map((p) => p.uatPort).filter(Boolean));
  if (!own.uatPort) await saveStandPort(slug, port);

  const res = await run('sudo', ['-n', EXPOSE_BIN, slug, String(port)], { timeoutMs: EXPOSE_TIMEOUT_MS });
  if (!res.ok) {
    const text = (res.stderr || res.error).trim().split('\n').filter(Boolean).at(-1) || 'команда завершилась с ошибкой';
    const hint = /password is required|not in the sudoers|may not run sudo/i.test(text) ? ': выполните на сервере deploy/uat-setup.sh' : `: ${text}`;
    throw domainError('unavailable', `Не удалось открыть стенд ${host}${hint}`);
  }
  return { host, port, url: `https://${host}` };
}

// Выдаёт проекту порт (один раз и навсегда) и открывает https://<slug>.<домен> в nginx. Можно вызывать повторно.
// Ошибки — DomainError.
export function ensureStand(slug) {
  const result = turn.then(() => ensure(slug));
  turn = result.catch(() => {});
  return result;
}
