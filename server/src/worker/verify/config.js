// Автопроверка перед статусом «На проверке». Запускаем только те скрипты,
// которые объявлены в package.json проекта: test и lint.
export const CHECK_NAMES = ['test', 'lint'];
export const CHECK_TIMEOUT_MS = 10 * 60 * 1000;
export const INSTALL_TIMEOUT_MS = 10 * 60 * 1000;
export const OUTPUT_TAIL = 1500;
