import { request } from './http.js';

// Портал заказчика
export const fetchPortalMe = () => request('/portal/me');
export const fetchPortalTasks = () => request('/portal/tasks');
export const postPortalComment = (taskId, text) =>
  request(`/portal/tasks/${taskId}/comments`, { method: 'POST', body: { text } });
