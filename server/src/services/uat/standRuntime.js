import { run } from '../ops/exec.js';
import { opsAvailable } from '../ops/platform.js';
import { childEnv } from '../../worker/env.js';

const UNITS = { B: 1, kB: 1e3, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1024 ** 2, GiB: 1024 ** 3, TiB: 1024 ** 4 };

// "45.2MiB" -> байты. Неразобранное значение считается нулём: память для информации, а не для решений.
export function parseSize(text) {
  const match = /^([\d.]+)\s*([A-Za-z]+)$/.exec(String(text).trim());
  return match && UNITS[match[2]] ? Math.round(Number(match[1]) * UNITS[match[2]]) : 0;
}

// Что сейчас запущено у стенда проекта и сколько памяти занимает. Контейнеры стенда помечены проектом compose uat-<код>.
// null, если сервер не Linux; { error }, если docker не ответил.
export async function standRuntime(slug) {
  if (!opsAvailable()) return null;
  const env = childEnv();
  const ps = await run('docker', ['ps', '-a', '--filter', `label=com.docker.compose.project=uat-${slug}`, '--format', '{{.ID}}|{{.State}}'], { env });
  if (!ps.ok) return { error: (ps.stderr || ps.error).trim().split('\n')[0] };
  const containers = ps.stdout.split('\n').filter(Boolean).map((line) => line.split('|'));
  const running = containers.filter(([, state]) => state === 'running').map(([id]) => id);
  let memoryBytes = 0;
  if (running.length > 0) {
    const stats = await run('docker', ['stats', '--no-stream', '--format', '{{.MemUsage}}', ...running], { env, timeoutMs: 30000 });
    if (stats.ok) memoryBytes = stats.stdout.split('\n').filter(Boolean).reduce((sum, line) => sum + parseSize(line.split('/')[0]), 0);
  }
  return { containers: containers.length, running: running.length, memoryBytes };
}
