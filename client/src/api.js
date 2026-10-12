// Все запросы к API проходят через этот модуль

const TOKEN_KEY = 'mytracker_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

function authHeaders(extra = {}) {
  const headers = { ...extra };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: authHeaders(body ? { 'Content-Type': 'application/json' } : {}),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || `Ошибка ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export const login = (password) =>
  request('/auth/login', { method: 'POST', body: { password } });

export const fetchTasks = () => request('/tasks');
export const getTask = (id) => request(`/tasks/${id}`);
export const createTask = (task) => request('/tasks', { method: 'POST', body: task });
export const updateTask = (id, patch) =>
  request(`/tasks/${id}`, { method: 'PATCH', body: patch });
export const addComment = (id, text) =>
  request(`/tasks/${id}/comments`, { method: 'POST', body: { text } });
export const runTask = (id) => request(`/tasks/${id}/run`, { method: 'POST' });
export const fetchCosts = () => request('/stats/costs');

export async function fetchDiff(id) {
  const res = await fetch(`/api/tasks/${id}/diff`, { headers: authHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const error = new Error(data.error || `Ошибка ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return res.text();
}
