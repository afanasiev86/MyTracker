import { getWebApp } from './webApp.js';

// Кнопка «Назад» Telegram: показывается, пока открыт экран внутри приложения
export function setBackButton(onBack) {
  const bb = getWebApp()?.BackButton;
  if (!bb) return () => {};
  if (!onBack) {
    bb.hide();
    return () => {};
  }
  const handler = () => onBack();
  bb.onClick(handler);
  bb.show();
  return () => bb.offClick(handler);
}
