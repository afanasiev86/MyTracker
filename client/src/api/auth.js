import { request } from './http.js';

export const login = (password) =>
  request('/auth/login', { method: 'POST', body: { password } });

export const loginWithTelegram = (initData) =>
  request('/auth/telegram', { method: 'POST', body: { initData } });

// Все выданные токены перестают работать (выход на всех устройствах)
export const revokeAllSessions = () => request('/auth/revoke', { method: 'POST' });
