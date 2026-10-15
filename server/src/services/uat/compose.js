import { run } from '../ops/exec.js';
import { childEnv } from '../../worker/env.js';
import { composeFile } from './standFiles.js';

const CONFIG_TIMEOUT_MS = 60 * 1000;
const UP_TIMEOUT_MS = 20 * 60 * 1000;

// Docker запускается без секретов сервера в окружении: иначе compose-файл мог бы подставить их через ${...}
export function runCompose(dir, slug, args, { timeoutMs = CONFIG_TIMEOUT_MS } = {}) {
  const base = ['compose', '-p', `uat-${slug}`, '--project-directory', dir, '-f', composeFile(dir)];
  return run('docker', [...base, ...args], { cwd: dir, env: childEnv(), timeoutMs });
}

// Нормализованный compose-файл. --no-env-resolution не раскрывает env_file: пути остаются на виду для проверки.
export async function readComposeConfig(dir, slug) {
  const res = await runCompose(dir, slug, ['config', '--no-env-resolution', '--format', 'json']);
  if (!res.ok) return { error: `docker compose не принял файл: ${(res.stderr || res.error).trim().split('\n').slice(-5).join(' ')}` };
  try {
    return { config: JSON.parse(res.stdout) };
  } catch {
    return { error: 'docker compose вернул не JSON' };
  }
}

export const composeUp = (dir, slug) => runCompose(dir, slug, ['up', '-d', '--build', '--wait', '--wait-timeout', '300'], { timeoutMs: UP_TIMEOUT_MS });
export const composeExec = (dir, slug, service, command) => runCompose(dir, slug, ['exec', '-T', service, ...command], { timeoutMs: UP_TIMEOUT_MS });
