// Объект Telegram WebApp или null вне Telegram
export function getWebApp() {
  return window.Telegram?.WebApp ?? null;
}

export function getInitData() {
  return getWebApp()?.initData || '';
}
