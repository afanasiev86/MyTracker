import { request } from './http.js';

// Хранилище вложений: какой провайдер активен и какие настроены
export const fetchStorage = () => request('/storage');
export const saveStorage = (provider) => request('/storage', { method: 'PUT', body: { provider } });
