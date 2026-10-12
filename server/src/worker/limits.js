// Признаки исчерпания лимита подписки в выводе Claude Code.
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
