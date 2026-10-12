import path from 'node:path';
import { ALLOWED_TYPES, MAX_ATTACHMENT_BYTES } from './config.js';
import { domainError } from '../errors.js';

// Проверяет тип и размер, возвращает расширение файла
export function checkAttachment(mime, size) {
  const ext = ALLOWED_TYPES[mime];
  if (!ext) throw domainError('unsupported', 'Можно прикреплять только PNG, JPEG, GIF или WebP');
  if (!size) throw domainError('invalid', 'Файл пустой');
  if (size > MAX_ATTACHMENT_BYTES) throw domainError('too_large', 'Файл больше 5 МБ');
  return ext;
}

// Имя для показа: без путей и слишком длинное
export function displayName(raw) {
  const base = path.basename(String(raw || '').trim());
  return (base || 'screenshot').slice(0, 100);
}
