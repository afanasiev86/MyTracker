import path from 'node:path';

const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };

// Имя файла на диске: номер и безопасное имя, без путей
export function screenshotFileName(index, name, mime) {
  const onlyName = path.basename(String(name));
  const base = onlyName.replace(/[^\w.-]+/g, '_').replace(/^\.+/, '').slice(0, 60) || 'screenshot';
  const hasExt = /\.(png|jpe?g|gif|webp)$/i.test(base);
  return `${index + 1}-${hasExt ? base : `${base}.${EXT[mime] || 'bin'}`}`;
}
