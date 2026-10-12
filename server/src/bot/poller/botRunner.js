import { startPolling } from './startPolling.js';

// Запуск и перезапуск бота. Перезапуск нужен, когда токен сменили или бота подключили уже после старта сервера.
let generation = 0;
let handlers = null;

export function registerBotHandlers(next) {
  handlers = next;
}

export function restartBot() {
  generation += 1;
  const mine = generation;
  void startPolling(handlers.handle, handlers.onCallback, handlers.onGuest, () => generation === mine);
}
