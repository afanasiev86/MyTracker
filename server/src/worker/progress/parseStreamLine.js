// Разбирает одну строку stdout. Возвращает событие или null для пустых и битых строк.
export function parseStreamLine(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}
