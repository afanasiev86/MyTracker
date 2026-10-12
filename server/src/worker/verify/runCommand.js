import { execFile } from 'node:child_process';

// Запускает команду и возвращает код выхода и объединённый вывод
export function runCommand(cmd, args, cwd, timeoutMs) {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd, timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024, env: process.env }, (err, stdout, stderr) => {
      const output = `${stdout}\n${stderr}`;
      resolve({ code: err ? (typeof err.code === 'number' ? err.code : 1) : 0, output });
    });
  });
}
