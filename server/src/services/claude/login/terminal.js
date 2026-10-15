// Разбор вывода `claude setup-token`, который идёт через псевдотерминал: в нём управляющие последовательности.

// Управляющие символы собираем из кодов: так их не приходится писать в регулярных выражениях (правило линтера)
const ESC = String.fromCharCode(27);
const BEL = String.fromCharCode(7);
const OSC = `${ESC}\\]`;
const OSC_END = `(?:${BEL}|${ESC}\\\\)`;

// Убирает управляющие последовательности (цвета, перемещение курсора, гиперссылки OSC 8)
export function stripAnsi(text) {
  return String(text)
    .replace(new RegExp(`${OSC}[^${BEL}${ESC}]*${OSC_END}`, 'g'), '')
    .replace(new RegExp(`${ESC}\\[[0-9;?<>=]*[ -/]*[@-~]`, 'g'), '')
    .replace(new RegExp(`${ESC}[()][A-Z0-9]|${ESC}[78=>]`, 'g'), '')
    .replace(/\r/g, '');
}

// Ссылка для входа: берём из гиперссылки OSC 8 (она не режется по ширине экрана), иначе из обычного текста
export function findLoginUrl(raw) {
  const link = new RegExp(`${OSC}8;[^;${BEL}${ESC}]*;(https://[^${BEL}${ESC}\\s]+)${OSC_END}`).exec(raw);
  const url = link?.[1] ?? /https:\/\/claude\.(?:com|ai)\/\S*oauth\/authorize\?\S+/.exec(stripAnsi(raw))?.[0];
  return url ?? null;
}

// Долгоживущий токен подписки, который команда печатает в конце
export function findToken(raw) {
  return /sk-ant-oat\d*-[A-Za-z0-9_-]{20,}/.exec(stripAnsi(raw))?.[0] ?? null;
}

// Сообщение об ошибке входа из вывода команды (без остального вывода: там нет секретов, но и пользы нет)
export function findLoginError(raw) {
  const line = stripAnsi(raw).split('\n').map((l) => l.trim()).find((l) => /error|invalid|expired|failed/i.test(l));
  // Подсказка «Press Enter to retry» относится к терминалу, владельцу она не нужна
  const text = line?.replace(/\s*Press Enter to retry\.?\s*$/i, '').replace(/\.$/, '');
  return text ? text.slice(0, 200) : null;
}
