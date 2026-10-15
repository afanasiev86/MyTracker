// Признаки исчерпания лимита подписки в сообщении об ошибке Claude Code.
// Проверять нужно только текст ошибки (итог упавшего запуска и stderr), а не весь вывод:
// в нём всё, что Claude прочитал и написал, и слова «rate limit» или «лимит» встречаются в обычном коде и комментариях
// (см. outcome.js: проверка только для упавшего запуска и только по тексту ошибки).
// Формат сообщения может меняться, поэтому список стоит дополнять по мере наблюдений.
const LIMIT_PATTERNS = [
  /usage limit/i,
  /rate limit/i,
  /limit reached/i,
  /лимит/i,
];

export function isLimitError(text) {
  if (!text) return false;
  return LIMIT_PATTERNS.some((re) => re.test(text));
}
