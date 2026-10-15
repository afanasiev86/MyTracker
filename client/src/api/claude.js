import { request } from './http.js';

// Аккаунт Claude: состояние подключения (ключ/токен сервер не отдаёт), подключение и отключение
export const fetchClaude = () => request('/claude');
export const saveClaude = (payload) => request('/claude', { method: 'PUT', body: payload });
export const deleteClaude = () => request('/claude', { method: 'DELETE' });
