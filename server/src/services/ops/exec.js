import { execFile } from 'node:child_process';

// Запуск внешней команды без оболочки: аргументы передаются списком, подставить в них команду нельзя.
// Не бросает исключений: итог в { ok, stdout, stderr, error }.
export function run(cmd, args, { timeoutMs = 15000, cwd, env } = {}) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: timeoutMs, cwd, env, maxBuffer: 8 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ ok: !err, stdout: String(stdout || ''), stderr: String(stderr || ''), error: err ? err.message : '' });
    });
  });
}
