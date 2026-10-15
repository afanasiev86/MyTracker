import fs from 'node:fs/promises';
import path from 'node:path';
import { git } from '../git.js';
import { SCREENSHOT_DIR } from './config.js';

// Добавляет папку в исключения git общего репозитория: коммиты её не увидят
export async function excludeFromGit(wt, dir = SCREENSHOT_DIR) {
  const common = (await git(wt, ['rev-parse', '--git-common-dir'])).trim();
  const file = path.join(path.resolve(wt, common), 'info', 'exclude');
  await fs.mkdir(path.dirname(file), { recursive: true });
  const current = await fs.readFile(file, 'utf8').catch(() => '');
  if (!current.split('\n').includes(`${dir}/`)) {
    await fs.appendFile(file, `\n${dir}/\n`);
  }
}
