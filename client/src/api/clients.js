import { request } from './http.js';

export const fetchClients = () => request('/clients');
export const createClient = (client) => request('/clients', { method: 'POST', body: client });
export const updateClient = (id, patch) =>
  request(`/clients/${id}`, { method: 'PATCH', body: patch });
export const deleteClient = (id) => request(`/clients/${id}`, { method: 'DELETE' });
export const revokeClientPortal = (id) => request(`/clients/${id}/portal/revoke`, { method: 'POST' });
