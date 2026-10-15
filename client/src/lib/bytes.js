const UNITS = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];

// Размер для человека: 1536 -> «1,5 КБ». null (не удалось определить) -> «—».
export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return '—';
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 ? String(value) : value.toFixed(value < 10 ? 1 : 0);
  return `${rounded.replace('.', ',')} ${UNITS[unit]}`;
}
