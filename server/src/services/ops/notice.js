import fs from 'node:fs/promises';
import path from 'node:path';
import { getConfig } from '../../config.js';
import { notify } from '../notify/owner.js';

// Служебные файлы переживают перезапуск API: так владелец узнаёт, чем закончилась операция,
// которая остановила сам сервер.
const opsDir = () => path.join(getConfig().ops.appDir, '.ops');
export const opsFile = (name) => path.join(opsDir(), name);

export async function writeNotice(text) {
  await fs.mkdir(opsDir(), { recursive: true });
  await fs.writeFile(opsFile('notice.json'), JSON.stringify({ text }));
}

// При старте сервера: отправляет сохранённое сообщение владельцу и удаляет его
export async function reportPendingNotice() {
  try {
    const { text } = JSON.parse(await fs.readFile(opsFile('notice.json'), 'utf8'));
    await fs.rm(opsFile('notice.json'), { force: true });
    if (text) await notify(text);
  } catch {
    // файла нет: ничего не ждёт отправки
  }
}
