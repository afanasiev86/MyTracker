import { getObjectStream } from '../storage.js';

// Поток файла для отдачи клиенту, или null, если вложения нет в задаче
export async function attachmentStream(task, attachmentId) {
  const item = task.attachments.id(attachmentId);
  if (!item) return null;
  const stream = await getObjectStream(item.provider || 'minio', item.fileName);
  return { stream, mime: item.mime, name: item.name };
}
