import fs from 'node:fs/promises';
import path from 'node:path';
import { readAttachments } from '../services/attachments.js';
import { git } from './git.js';

// Скриншоты задачи кладутся в рабочую копию в эту папку. Папка не попадает в коммиты.
export const SCREENSHOT_DIR = '.tracker-attachments';

const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };

// Имя файла на диске: номер и безопасное имя, без путей
export function screenshotFileName(index, name, mime) {
  const onlyName = path.basename(String(name));
  const base = onlyName.replace(/[^\w.-]+/g, '_').replace(/^\.+/, '').slice(0, 60) || 'screenshot';
  const hasExt = /\.(png|jpe?g|gif|webp)$/i.test(base);
  return `${index + 1}-${hasExt ? base : `${base}.${EXT[mime] || 'bin'}`}`;
}

// Добавляет папку в исключения git общего репозитория: коммиты её не увидят
export async function excludeFromGit(wt) {
  const common = (await git(wt, ['rev-parse', '--git-common-dir'])).trim();
  const file = path.join(path.resolve(wt, common), 'info', 'exclude');
  await fs.mkdir(path.dirname(file), { recursive: true });
  const current = await fs.readFile(file, 'utf8').catch(() => '');
  if (!current.split('\n').includes(`${SCREENSHOT_DIR}/`)) {
    await fs.appendFile(file, `\n${SCREENSHOT_DIR}/\n`);
  }
}

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

// Приписка к запуску: где лежат скриншоты. Пустая строка, если их нет.
export function screenshotNote(paths) {
  if (paths.length === 0) return '';
  return `\n\nК задаче приложены скриншоты: ${paths.join(', ')}. Открой их инструментом Read до начала работы.`;
}
