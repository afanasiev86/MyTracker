// Формат данных кнопок Telegram (callback_data до 64 байт).
// Без зависимостей, чтобы его можно было импортировать и из воркера, и из бота.

export const ACTIONS = ['diff', 'accept', 'rework', 'fix'];

export function encodeCallback(action, taskId) {
  return `${action}:${taskId}`;
}

export function decodeCallback(data) {
  const match = /^([a-z]+):([a-f0-9]{24})$/.exec(String(data || ''));
  if (!match || !ACTIONS.includes(match[1])) return null;
  return { action: match[1], id: match[2] };
}

// Кнопки под уведомлением о проверке задачи
export function reviewKeyboard(taskId) {
  return {
    inline_keyboard: [
      [{ text: 'Открыть diff', callback_data: encodeCallback('diff', taskId) }],
      [
        { text: 'Принять', callback_data: encodeCallback('accept', taskId) },
        { text: 'Вернуть в работу', callback_data: encodeCallback('rework', taskId) },
      ],
    ],
  };
}

// Кнопка под уведомлением об ошибке: попросить Claude исправить
export function failedKeyboard(taskId) {
  return { inline_keyboard: [[{ text: 'Исправить', callback_data: encodeCallback('fix', taskId) }]] };
}
