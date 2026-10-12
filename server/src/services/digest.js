// Утренний дайджест. Дни считаем по московскому времени, а не по времени сервера.

const TZ = 'Europe/Moscow';

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
});

// Возвращает день в формате YYYY-MM-DD и час по Москве
export function moscowParts(date) {
  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
  };
}

// Возвращает текст дайджеста или null, если сообщать не о чем
export function buildDigest(tasks, now) {
  const today = moscowParts(now).day;
  const open = tasks.filter((t) => t.status !== 'done');

  const waiting = open.filter((t) => t.status === 'waiting');
  const dueToday = open.filter((t) => t.dueDate && moscowParts(t.dueDate).day === today);
  const overdue = open.filter((t) => t.dueDate && moscowParts(t.dueDate).day < today);

  const sections = [];
  const line = (t) => `• ${t.project}: ${t.title}`;
  if (overdue.length) sections.push(`Просрочено (${overdue.length}):\n${overdue.map(line).join('\n')}`);
  if (dueToday.length) sections.push(`Сегодня (${dueToday.length}):\n${dueToday.map(line).join('\n')}`);
  if (waiting.length) sections.push(`Ждут ответа (${waiting.length}):\n${waiting.map(line).join('\n')}`);

  if (sections.length === 0) return null;
  return `Доброе утро! Сводка на ${today}\n\n${sections.join('\n\n')}`;
}
