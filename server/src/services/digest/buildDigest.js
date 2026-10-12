import { moscowParts } from './moscowParts.js';

// Текст дайджеста или null, если сообщать не о чем
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
