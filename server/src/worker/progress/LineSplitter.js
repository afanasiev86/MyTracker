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
