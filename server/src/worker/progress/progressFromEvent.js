import { short } from './short.js';
import { describeTool } from './describeTool.js';

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
