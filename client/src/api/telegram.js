import { request } from './http.js';

// Telegram-бот: состояние (токен сервер не отдаёт), подключение и отключение
export const fetchTelegram = () => request('/telegram');
export const saveTelegram = (settings) => request('/telegram', { method: 'PUT', body: settings });
export const deleteTelegram = () => request('/telegram', { method: 'DELETE' });
