// Разбор событий потока `claude --output-format stream-json --verbose`.
// Каждая строка stdout — отдельный JSON-объект.

const MAX_PROGRESS = 300;

function short(text) {
  const oneLine = String(text).replace(/\s+/g, ' ').trim();
  return oneLine.length > MAX_PROGRESS ? `${oneLine.slice(0, MAX_PROGRESS - 1)}…` : oneLine;
}

// Короткое описание вызова инструмента: что Claude делает прямо сейчас
function describeTool(block) {
  const input = block.input || {};
  const detail = input.command || input.file_path || input.pattern || input.description || '';
  return detail ? `${block.name}: ${detail}` : block.name;
}

// Возвращает строку прогресса из события или null, если событие не важно для статуса
export function progressFromEvent(event) {
  if (event?.type !== 'assistant') return null;
  const blocks = event.message?.content || [];
  // Берём последний содержательный блок: он отражает текущий шаг
  for (let i = blocks.length - 1; i >= 0; i -= 1) {
    const block = blocks[i];
    if (block.type === 'tool_use') return short(describeTool(block));
    if (block.type === 'text' && block.text?.trim()) return short(block.text);
  }
  return null;
}

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

// Итоговое событие с результатом запуска (type: "result"), если оно есть в выводе
export function findResult(stdout) {
  const lines = stdout.split('\n');
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const event = parseStreamLine(lines[i]);
    if (event?.type === 'result') return event;
  }
  return null;
}

// Накапливает буфер чанков и отдаёт полные строки
export class LineSplitter {
  constructor() {
    this.buffer = '';
  }

  push(chunk) {
    this.buffer += chunk;
    const parts = this.buffer.split('\n');
    this.buffer = parts.pop();
    return parts;
  }

  flush() {
    const rest = this.buffer;
    this.buffer = '';
    return rest ? [rest] : [];
  }
}
