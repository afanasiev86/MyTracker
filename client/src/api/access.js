import { request } from './http.js';

// Запросы доступа к порталу (владелец)
export const fetchAccessRequests = () => request('/access');
export const approveAccessRequest = (id, clientId) =>
  request(`/access/${id}/approve`, { method: 'POST', body: { clientId } });
export const rejectAccessRequest = (id) => request(`/access/${id}/reject`, { method: 'POST' });
