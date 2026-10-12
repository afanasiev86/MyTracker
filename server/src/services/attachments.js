import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { putObject, getObjectStream, getActiveProvider } from './storage.js';

// Вложения задач (скриншоты к UI-багам). Файлы лежат в выбранном хранилище (MinIO или S3),
// в базе только метаданные. Бакет приватный: файлы отдаёт API после проверки входа.
export const ALLOWED_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Проверяет тип и размер, возвращает расширение файла
export function checkAttachment(mime, size) {
  const ext = ALLOWED_TYPES[mime];
  if (!ext) throw httpError(415, 'Можно прикреплять только PNG, JPEG, GIF или WebP');
  if (!size) throw httpError(400, 'Файл пустой');
  if (size > MAX_ATTACHMENT_BYTES) throw httpError(413, 'Файл больше 5 МБ');
  return ext;
}

// Имя для показа: без путей и слишком длинное
export function displayName(raw) {
  const base = path.basename(String(raw || '').trim());
  return (base || 'screenshot').slice(0, 100);
}

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

// Поток файла для отдачи клиенту, или null, если вложения нет в задаче
export async function attachmentStream(task, attachmentId) {
  const item = task.attachments.id(attachmentId);
  if (!item) return null;
  const stream = await getObjectStream(item.provider || 'minio', item.fileName);
  return { stream, mime: item.mime, name: item.name };
}

// Файлы вложений целиком, для воркера (он кладёт их в рабочую копию). Лимит на число файлов.
export const MAX_SCREENSHOTS_PER_RUN = 10;

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
