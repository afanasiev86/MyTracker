import { getWebApp } from './webApp.js';

// Подтверждение действия. В Telegram — нативное окно, в браузере — window.confirm
export function confirmAction(message) {
  const wa = getWebApp();
  if (wa?.showConfirm) {
    return new Promise((resolve) => wa.showConfirm(message, (ok) => resolve(Boolean(ok))));
  }
  return Promise.resolve(window.confirm(message));
}
