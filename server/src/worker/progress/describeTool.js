// Короткое описание вызова инструмента: что Claude делает прямо сейчас
export function describeTool(block) {
  const input = block.input || {};
  const detail = input.command || input.file_path || input.pattern || input.description || '';
  return detail ? `${block.name}: ${detail}` : block.name;
}
