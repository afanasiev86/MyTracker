import { request } from './http.js';

export const fetchProjects = () => request('/projects');
export const createProject = (project) => request('/projects', { method: 'POST', body: project });
export const updateProject = (id, patch) =>
  request(`/projects/${id}`, { method: 'PATCH', body: patch });
export const deleteProject = (id) => request(`/projects/${id}`, { method: 'DELETE' });
