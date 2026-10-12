// Кнопки подтверждения опасных действий над сервером: ops:<действие>:<цель>:<минута выдачи>.
// Минута нужна, чтобы старая кнопка из чата не сработала снова: подтверждение живёт недолго.
export const OPS_CONFIRM_TTL_MIN = 5;

const MINUTE_MS = 60 * 1000;

export function encodeOpsCallback(action, target = '-', now = Date.now()) {
  return `ops:${action}:${target}:${Math.floor(now / MINUTE_MS).toString(36)}`;
}

// null — не наша кнопка; { expired: true } — подтверждение устарело
export function decodeOpsCallback(data, now = Date.now()) {
  const match = /^ops:([a-z]+):([a-z0-9-]+):([a-z0-9]+)$/.exec(String(data || ''));
  if (!match) return null;
  const issued = Number.parseInt(match[3], 36);
  if (Math.floor(now / MINUTE_MS) - issued > OPS_CONFIRM_TTL_MIN) return { expired: true };
  return { action: match[1], target: match[2] };
}

// Вопрос с кнопками «Подтвердить» и «Отмена»
export function confirmKeyboard(action, target = '-') {
  return {
    inline_keyboard: [[
      { text: 'Подтвердить', callback_data: encodeOpsCallback(action, target) },
      { text: 'Отмена', callback_data: encodeOpsCallback('cancel') },
    ]],
  };
}
