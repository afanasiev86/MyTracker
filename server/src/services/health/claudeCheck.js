import { execFile } from 'node:child_process';
import { TIMEOUT_MS } from './withTimeout.js';
import { getConfig } from '../../config.js';

// Claude Code доступен, если его бинарник отвечает на --version (запросов к модели не делает)
export function claudeCheck() {
  const bin = getConfig().worker.claudeBin;
  return new Promise((resolve) => {
    execFile(bin, ['--version'], { timeout: TIMEOUT_MS }, (err, stdout) => {
      if (err) resolve({ ok: false, error: 'не найден или не отвечает' });
      else resolve({ ok: true, version: stdout.trim() });
    });
  });
}
