import mongoose from 'mongoose';
import Task from '../../models/Task.js';
import { acceptTask } from '../../services/runs/acceptTask.js';
import { startTask } from '../../services/runs/startTask.js';
import { fixTask } from '../../services/runs/fixTask.js';
import { decodeCallback } from '../callbackData.js';
import { showDiff } from './showDiff.js';
import { handleOpsCallback } from './opsCallback.js';

// Нажатие кнопки под уведомлением. Возвращает строку для ответа владельцу.
export async function handleCallback(data) {
  if (String(data).startsWith('ops:')) return handleOpsCallback(data);
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

  if (parsed.action === 'fix') {
    const result = await fixTask(task);
    return result.error ?? `Задача ${task._id}: Claude исправляет ошибку.`;
  }

  // rework: та же логика, что у кнопки «Вернуть в работу» в интерфейсе
  const result = await startTask(task);
  return result.error ?? `Задача ${task._id} снова запущена в Claude.`;
}
