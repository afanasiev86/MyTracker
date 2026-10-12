import { getWebApp } from './webApp.js';

// Главная кнопка Telegram внизу экрана. Вне Telegram ничего не делает.
// Возвращает функцию, которая скрывает кнопку.
export function setMainButton(text, onClick) {
  const mb = getWebApp()?.MainButton;
  if (!mb) return () => {};
  if (!text) {
    mb.hide();
    return () => {};
  }
  mb.setText(text);
  mb.onClick(onClick);
  mb.show();
  return () => {
    mb.offClick(onClick);
    mb.hide();
  };
}
