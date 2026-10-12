import { taskDiff } from '../../services/diff.js';

// Лимит текста одного сообщения Telegram с запасом
const MAX_DIFF_TEXT = 3500;

// Текст diff для Telegram, с обрезкой по лимиту сообщения
export async function showDiff(task) {
  if (!task.branch) return 'Ветка ещё не создана.';
  const diff = await taskDiff(task);
  if (!diff.trim()) return 'В ветке пока нет изменений относительно основной.';
  const head = `Diff ${task._id}:\n`;
  if (diff.length <= MAX_DIFF_TEXT) return head + diff;
  return `${head}${diff.slice(0, MAX_DIFF_TEXT)}\n…\nПоказана часть diff. Полностью — в трекере.`;
}
