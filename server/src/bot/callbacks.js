import mongoose from 'mongoose';
import Task from '../models/Task.js';
import { acceptTask, startTask } from '../services/runs.js';
import { taskDiff } from '../services/diff.js';
import { decodeCallback } from './callbackData.js';

// Лимит текста одного сообщения Telegram с запасом
const MAX_DIFF_TEXT = 3500;

async function showDiff(task) {
  if (!task.branch) return 'Ветка ещё не создана.';
  const diff = await taskDiff(task);
  if (!diff.trim()) return 'В ветке пока нет изменений относительно основной.';
  const head = `Diff ${task._id}:\n`;
  if (diff.length <= MAX_DIFF_TEXT) return head + diff;
  return `${head}${diff.slice(0, MAX_DIFF_TEXT)}\n…\nПоказана часть diff. Полностью — в трекере.`;
}

// Нажатие кнопки под уведомлением. Возвращает строку для ответа владельцу.
export async function handleCallback(data) {
  const parsed = decodeCallback(data);
  if (!parsed) return 'Эта кнопка устарела.';
  if (!mongoose.isValidObjectId(parsed.id)) return 'Задача не найдена';

  const task = await Task.findById(parsed.id);
  if (!task) return 'Задача не найдена';

  if (parsed.action === 'diff') return showDiff(task);

  if (parsed.action === 'accept') {
    const result = await acceptTask(task);
    return result.error ?? `Задача ${task._id} принята.`;
  }

  // rework: та же логика, что у кнопки «Вернуть в работу» в интерфейсе
  const result = await startTask(task);
  return result.error ?? `Задача ${task._id} снова запущена в Claude.`;
}
