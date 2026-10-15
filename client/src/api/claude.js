import { request } from './http.js';

// Аккаунт Claude: состояние подключения (ключ/токен сервер не отдаёт), подключение и отключение
export const fetchClaude = () => request('/claude');
export const saveClaude = (payload) => request('/claude', { method: 'PUT', body: payload });
export const deleteClaude = () => request('/claude', { method: 'DELETE' });

// Вход в подписку Claude: сервер отдаёт ссылку для браузера, затем принимает код со страницы входа
export const startClaudeLogin = () => request('/claude/login', { method: 'POST' });
export const finishClaudeLogin = (payload) => request('/claude/login/code', { method: 'POST', body: payload });
export const cancelClaudeLogin = () => request('/claude/login', { method: 'DELETE' });
