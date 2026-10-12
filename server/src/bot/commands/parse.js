// ID задачи в тексте уведомления: по нему понимаем, на какой вопрос отвечает владелец
export const ID_IN_TEXT = /ID: ([a-f0-9]{24})/;

// Разбор команды: «/Run@bot 123» -> { cmd: '/run', args: ['123'] }
export function parseCommand(text) {
  const [head = '', ...args] = text.trim().split(/\s+/);
  return { cmd: head.toLowerCase().replace(/@\S+$/, ''), args };
}
