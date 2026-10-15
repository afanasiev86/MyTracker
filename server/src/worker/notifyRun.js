import { STATUS_LABELS } from '../../../shared/statuses.js';
import { notify } from '../services/notify/owner.js';
import { reviewKeyboard, failedKeyboard } from '../bot/callbackData.js';

const ICONS = { review: '🔍', failed: '❌', ready: '⏸', waiting: '❓' };

// Сообщение владельцу о результате запуска. На проверку — с кнопками diff, принять, вернуть.
export async function notifyRunFinished(task, outcome, checksText) {
  const title = outcome.status === 'waiting'
    ? `${task.project}: ${task.title}\nClaude ждёт ответа:\n${outcome.summary}\n\n` +
      `Ответьте ответом на это сообщение или командой /answer ${task._id} текст`
    : `${task.project}: ${task.title}\nСтатус: ${STATUS_LABELS[task.status]}\n${outcome.summary.slice(0, 800)}` +
      (checksText ? `\nАвтопроверка: ${checksText}` : '');
  const keyboards = { review: reviewKeyboard, failed: failedKeyboard };
  const extra = keyboards[task.status] ? { reply_markup: keyboards[task.status](task._id) } : {};
  await notify(`${ICONS[task.status] ?? 'ℹ️'} ${title}\nID: ${task._id}`, extra);
}
