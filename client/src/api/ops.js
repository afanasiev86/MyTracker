import { request } from './http.js';

// Раздел «Сервер»: метрики, сервисы, журналы и обновление
export const fetchOps = () => request('/ops');
export const controlService = (id, action) => request(`/ops/services/${id}/${action}`, { method: 'POST' });
export const fetchServiceLogs = (id, lines) => request(`/ops/services/${id}/logs?lines=${lines}`);
export const startDeploy = () => request('/ops/deploy', { method: 'POST' });
