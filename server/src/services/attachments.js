// Фасад вложений: реализация разнесена по папке attachments/.
// Файлы лежат в выбранном хранилище (MinIO или S3), в базе только метаданные.
export { ALLOWED_TYPES, MAX_ATTACHMENT_BYTES, MAX_SCREENSHOTS_PER_RUN } from './attachments/config.js';
export { checkAttachment, displayName } from './attachments/validate.js';
export { saveAttachment } from './attachments/saveAttachment.js';
export { attachmentStream } from './attachments/attachmentStream.js';
export { readAttachments } from './attachments/readAttachments.js';
