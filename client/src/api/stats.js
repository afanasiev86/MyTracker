import { request } from './http.js';

// Стоимость по проектам
export const fetchCosts = () => request('/stats/costs');
