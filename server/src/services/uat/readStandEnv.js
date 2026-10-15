import fs from 'node:fs/promises';
import path from 'node:path';
import { standDir } from './standFiles.js';

// Ключи, значения которых интерфейс прячет до явного показа: пароли и ключи стенда
const SECRET_KEY = /SECRET|PASSWORD|PASS|TOKEN|KEY/i;

// Файл .env стенда: порт, адрес и пароли, которые трекер дал compose-файлу. Пишет их writeStandEnv при сборке.
// Возвращает { exists, path, entries: [{ key, value, secret }] }.
export async function readStandEnv(slug) {
  const file = path.posix.join(standDir(slug), '.env');
  const text = await fs.readFile(file, 'utf8').catch(() => null);
  if (text === null) return { exists: false, path: file, entries: [] };
  const entries = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const key = line.slice(0, line.indexOf('='));
      return { key, value: line.slice(line.indexOf('=') + 1), secret: SECRET_KEY.test(key) };
    });
  return { exists: true, path: file, entries };
}
