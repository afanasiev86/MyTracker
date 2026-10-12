// Приписка к запуску: где лежат скриншоты. Пустая строка, если их нет.
export function screenshotNote(paths) {
  if (paths.length === 0) return '';
  return `\n\nК задаче приложены скриншоты: ${paths.join(', ')}. Открой их инструментом Read до начала работы.`;
}
