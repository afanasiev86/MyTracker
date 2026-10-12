import { parseStreamLine } from './parseStreamLine.js';

// Итоговое событие с результатом запуска (type: "result"), если оно есть в выводе
export function findResult(stdout) {
  const lines = stdout.split('\n');
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const event = parseStreamLine(lines[i]);
    if (event?.type === 'result') return event;
  }
  return null;
}
