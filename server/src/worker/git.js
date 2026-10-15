import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { gitEnv } from './env.js';

const execFileAsync = promisify(execFile);

// Вызов git без shell: аргументы не интерпретируются оболочкой.
// Окружение (токен GitHub для https) собирает gitEnv; options.env подменяют только тесты.
export async function git(cwd, args, { env = gitEnv() } = {}) {
  const { stdout } = await execFileAsync('git', ['-C', cwd, ...args], {
    maxBuffer: 50 * 1024 * 1024,
    env,
  });
  return stdout;
}
