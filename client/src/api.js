// Все запросы к API проходят через этот модуль

const TOKEN_KEY = 'mytracker_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
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
export const createTask = (task) => request('/tasks', { method: 'POST', body: task });
export const updateTask = (id, patch) =>
  request(`/tasks/${id}`, { method: 'PATCH', body: patch });
