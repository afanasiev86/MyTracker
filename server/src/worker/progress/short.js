export const MAX_PROGRESS = 300;

// Сводит текст к одной строке не длиннее MAX_PROGRESS
export function short(text) {
  const oneLine = String(text).replace(/\s+/g, ' ').trim();
  return oneLine.length > MAX_PROGRESS ? `${oneLine.slice(0, MAX_PROGRESS - 1)}…` : oneLine;
}
