import { readFile } from '../storage/files.js';
import { MAX_SCREENSHOTS_PER_RUN } from './config.js';

// Файлы вложений целиком, для воркера (он кладёт их в рабочую копию). Лимит на число файлов.
export async function readAttachments(task) {
  const items = task.attachments.slice(0, MAX_SCREENSHOTS_PER_RUN);
  return Promise.all(items.map(async (item) => ({
    name: item.name,
    mime: item.mime,
    buffer: await readFile(item.fileName),
  })));
}
