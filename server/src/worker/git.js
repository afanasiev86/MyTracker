import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Вызов git без shell: аргументы не интерпретируются оболочкой
export async function git(cwd, args) {
  const { stdout } = await execFileAsync('git', ['-C', cwd, ...args], {
    maxBuffer: 50 * 1024 * 1024,
  });
  return stdout;
}
