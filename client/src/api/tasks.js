import { request, authHeaders, networkError, httpError } from './http.js';

export const fetchTasks = () => request('/tasks');
export const getTask = (id) => request(`/tasks/${id}`);
export const createTask = (task) => request('/tasks', { method: 'POST', body: task });
export const updateTask = (id, patch) =>
  request(`/tasks/${id}`, { method: 'PATCH', body: patch });
export const addComment = (id, text, visibleToClient = false) =>
  request(`/tasks/${id}/comments`, { method: 'POST', body: { text, visibleToClient } });
export const runTask = (id) => request(`/tasks/${id}/run`, { method: 'POST' });
export const answerTask = (id, text) =>
  request(`/tasks/${id}/answer`, { method: 'POST', body: { text } });
export const cancelTask = (id) => request(`/tasks/${id}/cancel`, { method: 'POST' });

// Diff ветки — обычный текст, а не JSON
export async function fetchDiff(id) {
  let res;
  try {
    res = await fetch(`/api/tasks/${id}/diff`, { headers: authHeaders() });
  } catch {
    throw networkError();
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw httpError(res.status, data.error);
  }
  return res.text();
}
