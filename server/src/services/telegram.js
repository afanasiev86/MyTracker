// Фасад Telegram: реализация разнесена по папке services/telegram/
export { telegramEnabled, telegramApi } from './telegram/api.js';
export { sendTelegramTo, sendTelegram } from './telegram/send.js';
