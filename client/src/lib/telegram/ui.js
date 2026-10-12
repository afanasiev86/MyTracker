import { getWebApp } from './webApp.js';

// Сообщаем Telegram, что приложение готово, разворачиваем на весь экран и
// подключаем цвета темы Telegram к переменным CSS.
export function initTelegramUi() {
  const wa = getWebApp();
  if (!wa) return;

  wa.ready();
  wa.expand();

  const theme = wa.themeParams || {};
  const root = document.documentElement.style;
  if (theme.secondary_bg_color) root.setProperty('--bg', theme.secondary_bg_color);
  if (theme.bg_color) root.setProperty('--card', theme.bg_color);
  if (theme.text_color) root.setProperty('--text', theme.text_color);
  if (theme.hint_color) root.setProperty('--muted', theme.hint_color);
  if (theme.button_color) root.setProperty('--accent', theme.button_color);
  if (theme.button_text_color) root.setProperty('--accent-text', theme.button_text_color);
}
