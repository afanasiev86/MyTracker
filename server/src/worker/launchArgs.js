import { claudeTools, TRACKER_CLI } from './claudeTools.js';
import { screenshotNote } from './screenshots/screenshotNote.js';
import { FIX_HEADER } from '../services/runs/fixPrompt.js';

const BASE_FLAGS = ['--output-format', 'stream-json', '--verbose', '--allowedTools'];

// Правило разрешений сверяет текст команды, а не значение переменной: поэтому скрипт трекера
// передаём полным путём (тот же путь в --allowedTools), а не через $TRACKER_CLI.
const cliNote = () => `\n\nСкрипт трекера: ${TRACKER_CLI}. Вызывай его только по этому полному пути, без переменных окружения.`;

// Аргументы claude для запуска задачи.
// answer и sessionId: ответ на вопрос в той же сессии (--resume).
// answer без sessionId: сессии нет, передаём ответ вместе с командой.
// Сообщение «исправь ошибку» (начинается с FIX_HEADER) идёт как есть: это не ответ на вопрос.
// Тип задачи (поле kind) skill берёт из GET /tasks/:id, в аргументы его не кладём:
// аргумент команды используется как ID.
export function launchArgs({ taskId, answer, sessionId, screenshots }) {
  if (answer && sessionId) {
    return ['-p', `${answer}${cliNote()}`, '--resume', sessionId, ...BASE_FLAGS, claudeTools()];
  }
  if (answer) {
    const message = answer.startsWith(FIX_HEADER) ? answer : `Ответ владельца на ваш вопрос: ${answer}`;
    return ['-p', `/implement-task ${taskId}\n\n${message}${screenshotNote(screenshots)}${cliNote()}`, ...BASE_FLAGS, claudeTools()];
  }
  return ['-p', `/implement-task ${taskId}${screenshotNote(screenshots)}${cliNote()}`, ...BASE_FLAGS, claudeTools()];
}
