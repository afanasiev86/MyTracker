import fs from 'node:fs/promises';
import path from 'node:path';
import { readAttachments } from '../../services/attachments.js';
import { SCREENSHOT_DIR } from './config.js';
import { screenshotFileName } from './screenshotFileName.js';
import { excludeFromGit } from './excludeFromGit.js';

// Записывает скриншоты в рабочую копию. Возвращает относительные пути для подсказки Claude.
export async function materializeScreenshots(task, wt) {
  const files = await readAttachments(task);
  if (files.length === 0) return [];
  const dir = path.join(wt, SCREENSHOT_DIR);
  await fs.mkdir(dir, { recursive: true });
  await excludeFromGit(wt);
  const paths = [];
  for (const [index, file] of files.entries()) {
    const rel = `${SCREENSHOT_DIR}/${screenshotFileName(index, file.name, file.mime)}`;
    await fs.writeFile(path.join(wt, rel), file.buffer);
    paths.push(rel);
  }
  return paths;
}
