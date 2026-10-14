import { randomUUID } from 'node:crypto';
import { putFile } from '../storage/files.js';
import { checkAttachment, displayName } from './validate.js';

// Сохраняет файл на диск и добавляет метаданные в задачу
export async function saveAttachment(task, buffer, mime, rawName) {
  const ext = checkAttachment(mime, buffer.length);
  const key = `${task._id}/${randomUUID()}.${ext}`;
  await putFile(key, buffer);

  task.attachments.push({ fileName: key, name: displayName(rawName), mime, size: buffer.length });
  await task.save();
  return task.attachments[task.attachments.length - 1];
}
