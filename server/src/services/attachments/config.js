// Допустимые типы картинок и предел размера вложения
export const ALLOWED_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
// Сколько картинок передаём Claude в один запуск
export const MAX_SCREENSHOTS_PER_RUN = 10;
