import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { canTransition, STATUS_LABELS } from '../../../shared/statuses.js';
import { startTask } from '../services/runs.js';

const HELP = [
  'Команды:',
  '/new <проект> <заголовок>: создать задачу',
  '/ready <id>: перевести в «Готово к работе»',
  '/run <id>: запустить в Claude',
  '/status: активные задачи',
  '/app: открыть трекер',
].join('\n');

function appButton() {
  const url = process.env.TELEGRAM_MINIAPP_URL;
  if (!url) {
    return 'Mini App не настроен: задайте TELEGRAM_MINIAPP_URL (HTTPS-адрес) и перезапустите сервер.';
  }
  return {
    text: 'Трекер',
    reply_markup: { inline_keyboard: [[{ text: 'Открыть трекер', web_app: { url } }]] },
  };
}

export function parseCommand(text) {
  const [head = '', ...args] = text.trim().split(/\s+/);
  return { cmd: head.toLowerCase().replace(/@\S+$/, ''), args };
}

async function findTask(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Task.findById(id);
}

// Возвращает строку или { text, reply_markup } для Telegram
export async function handleCommand(text) {
  const { cmd, args } = parseCommand(text);

  if (cmd === '/app') return appButton();

  if (cmd === '/new') {
    const [project, ...words] = args;
    const title = words.join(' ');
    if (!project || !title) return 'Формат: /new <проект> <заголовок>';
    if (!(await Project.exists({ slug: project }))) {
      return `Проект «${project}» не найден. Создайте его в CRM или проверьте slug.`;
    }
    const task = await Task.create({ project, title });
    return `Создана задача ${task._id}\n${project}: ${title}`;
  }

  if (cmd === '/ready' || cmd === '/run') {
    const [id] = args;
    if (!id) return `Формат: ${cmd} <id>`;
    const task = await findTask(id);
    if (!task) return 'Задача не найдена';

    if (cmd === '/ready') {
      if (task.status === 'ready') return 'Задача уже готова к работе';
      if (!canTransition(task.status, 'ready')) {
        return `Из статуса «${STATUS_LABELS[task.status]}» нельзя перевести в «Готово к работе»`;
      }
      task.status = 'ready';
      await task.save();
      return `Задача ${id} готова к работе. Запуск: /run ${id}`;
    }

    const result = await startTask(task);
    return result.error ?? `Задача ${id} запущена в Claude. Уведомление придёт по завершении.`;
  }

  if (cmd === '/status') {
    const tasks = await Task.find({ status: { $in: ['in_progress', 'review', 'ready'] } })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();
    if (tasks.length === 0) return 'Активных задач нет.';
    return tasks
      .map((t) => `[${STATUS_LABELS[t.status]}] ${t.project}: ${t.title}\n${t._id}`)
      .join('\n\n');
  }

  return HELP;
}
