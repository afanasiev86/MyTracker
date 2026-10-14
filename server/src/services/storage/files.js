import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { getConfig } from '../../config.js';

// Файлы вложений лежат в ATTACHMENTS_DIR; ключ вида <id задачи>/<uuid>.<расширение> создаёт сервер
const filePath = (key) => path.join(getConfig().attachmentsDir, key);

export async function putFile(key, buffer) {
  const file = filePath(key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, buffer);
}

export const readFile = (key) => fs.readFile(filePath(key));

export const fileStream = (key) => createReadStream(filePath(key));

// Папка существует (создаётся при необходимости) и доступна на запись
export async function checkWritable() {
  const dir = getConfig().attachmentsDir;
  await fs.mkdir(dir, { recursive: true });
  await fs.access(dir, fs.constants.W_OK);
}
