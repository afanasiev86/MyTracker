import { request } from './http.js';

// Состояние сервисов и запусков (только владелец)
export const fetchHealthDetails = () => request('/health/details');
