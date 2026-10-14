import { fileStream } from '../storage/files.js';

// Поток файла для отдачи клиенту, или null, если вложения нет в задаче
export function attachmentStream(task, attachmentId) {
  const item = task.attachments.id(attachmentId);
  if (!item) return null;
  return { stream: fileStream(item.fileName), mime: item.mime, name: item.name };
}
