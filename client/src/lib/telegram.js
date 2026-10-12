// Работа с Telegram WebApp API. Вне Telegram все функции ничего не делают.
// Каждая функция лежит в папке lib/telegram/.
export { getWebApp, getInitData } from './telegram/webApp.js';
export { initTelegramUi } from './telegram/ui.js';
export { confirmAction } from './telegram/confirm.js';
export { setBackButton } from './telegram/backButton.js';
export { setMainButton } from './telegram/mainButton.js';
export { haptic } from './telegram/haptic.js';
