import { randomUUID } from 'node:crypto';
import { putObject } from '../storage/objects.js';
import { getActiveProvider } from '../storage/selection.js';
import { checkAttachment, displayName } from './validate.js';

// Сохраняет файл в выбранное хранилище и добавляет метаданные в задачу.
// Провайдер записывается в вложение: смена хранилища не ломает старые файлы.
export async function saveAttachment(task, buffer, mime, rawName) {
  const ext = checkAttachment(mime, buffer.length);
  const provider = await getActiveProvider();
  const key = `${task._id}/${randomUUID()}.${ext}`;
  await putObject(provider, key, buffer, mime);

  task.attachments.push({ fileName: key, provider, name: displayName(rawName), mime, size: buffer.length });
  await task.save();
  return task.attachments[task.attachments.length - 1];
}
