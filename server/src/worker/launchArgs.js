import { claudeTools } from './claudeTools.js';
import { screenshotNote } from './screenshots.js';

const BASE_FLAGS = ['--output-format', 'stream-json', '--verbose', '--allowedTools'];

// Аргументы claude для запуска задачи.
// answer и sessionId: ответ на вопрос в той же сессии (--resume).
// answer без sessionId: сессии нет, передаём ответ вместе с командой.
// Тип задачи (поле kind) skill берёт из GET /tasks/:id, в аргументы его не кладём:
// аргумент команды используется как ID.
export function launchArgs({ taskId, answer, sessionId, screenshots }) {
  if (answer && sessionId) {
    return ['-p', answer, '--resume', sessionId, ...BASE_FLAGS, claudeTools()];
  }
  if (answer) {
    return ['-p', `/implement-task ${taskId}\n\nОтвет владельца на ваш вопрос: ${answer}${screenshotNote(screenshots)}`, ...BASE_FLAGS, claudeTools()];
  }
  return ['-p', `/implement-task ${taskId}${screenshotNote(screenshots)}`, ...BASE_FLAGS, claudeTools()];
}
