import { getObjectStream } from '../storage/objects.js';
import { MAX_SCREENSHOTS_PER_RUN } from './config.js';

// Файлы вложений целиком, для воркера (он кладёт их в рабочую копию). Лимит на число файлов.
export async function readAttachments(task) {
  const items = task.attachments.slice(0, MAX_SCREENSHOTS_PER_RUN);
  const out = [];
  for (const item of items) {
    const stream = await getObjectStream(item.provider || 'minio', item.fileName);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    out.push({ name: item.name, mime: item.mime, buffer: Buffer.concat(chunks) });
  }
  return out;
}
