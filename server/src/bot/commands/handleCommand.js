import { ID_IN_TEXT, parseCommand } from './parse.js';
import { HELP } from './help.js';
import { appButton } from './appButton.js';
import { answerById } from './answerById.js';
import { newTaskCommand } from './newTask.js';
import { answerCommand } from './answerCommand.js';
import { cancelCommand } from './cancelCommand.js';
import { readyRunCommand } from './readyRunCommand.js';
import { statusCommand } from './statusCommand.js';
import { serverCommand, logsCommand, serviceCommand, deployCommand, unbanCommand } from './opsCommand.js';

// Возвращает строку или { text, reply_markup } для Telegram.
// replyToText — текст сообщения, на которое ответил владелец (там есть ID задачи).
export async function handleCommand(text, replyToText = '') {
  const replyId = replyToText.match(ID_IN_TEXT)?.[1];
  if (replyId && !text.startsWith('/')) {
    return answerById(replyId, text.trim());
  }

  const { cmd, args } = parseCommand(text);
  if (cmd === '/app') return appButton();
  if (cmd === '/new') return newTaskCommand(args);
  if (cmd === '/answer') return answerCommand(args);
  if (cmd === '/cancel') return cancelCommand(args);
  if (cmd === '/ready' || cmd === '/run') return readyRunCommand(cmd, args);
  if (cmd === '/status') return statusCommand();
  if (cmd === '/server') return serverCommand();
  if (cmd === '/logs') return logsCommand(args);
  if (cmd === '/service') return serviceCommand(args);
  if (cmd === '/deploy') return deployCommand();
  if (cmd === '/unban') return unbanCommand();
  return HELP;
}
