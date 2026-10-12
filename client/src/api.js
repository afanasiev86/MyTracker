// Все запросы к API проходят через этот модуль

const TOKEN_KEY = 'mytracker_token';

// Событие для всего приложения: токен истёк или недействителен
export const UNAUTHORIZED_EVENT = 'mytracker:unauthorized';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

function authHeaders(extra = {}) {
  const headers = { ...extra };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function networkError() {
  return new Error('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.');
}

function httpError(status, message) {
  const error = new Error(message || `Ошибка ${status}`);
  error.status = status;
  return error;
}

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: authHeaders(body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw networkError();
  }
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Вход по паролю и через Telegram обрабатывает 401 сам, остальные маршруты — нет
    if (res.status === 401 && getToken() && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw httpError(res.status, data.error);
  }
  return data;
}

export const login = (password) =>
  request('/auth/login', { method: 'POST', body: { password } });

export const loginWithTelegram = (initData) =>
  request('/auth/telegram', { method: 'POST', body: { initData } });

// Задачи
export const fetchTasks = () => request('/tasks');
export const getTask = (id) => request(`/tasks/${id}`);
export const createTask = (task) => request('/tasks', { method: 'POST', body: task });
export const updateTask = (id, patch) =>
  request(`/tasks/${id}`, { method: 'PATCH', body: patch });
export const addComment = (id, text) =>
  request(`/tasks/${id}/comments`, { method: 'POST', body: { text } });
export const runTask = (id) => request(`/tasks/${id}/run`, { method: 'POST' });
export const answerTask = (id, text) =>
  request(`/tasks/${id}/answer`, { method: 'POST', body: { text } });
export const cancelTask = (id) => request(`/tasks/${id}/cancel`, { method: 'POST' });

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

// Проекты
export const fetchProjects = () => request('/projects');
export const createProject = (project) => request('/projects', { method: 'POST', body: project });
export const updateProject = (id, patch) =>
  request(`/projects/${id}`, { method: 'PATCH', body: patch });
export const deleteProject = (id) => request(`/projects/${id}`, { method: 'DELETE' });

// Клиенты
export const fetchClients = () => request('/clients');
export const createClient = (client) => request('/clients', { method: 'POST', body: client });
export const updateClient = (id, patch) =>
  request(`/clients/${id}`, { method: 'PATCH', body: patch });
export const deleteClient = (id) => request(`/clients/${id}`, { method: 'DELETE' });

// Стоимость по проектам
export const fetchCosts = () => request('/stats/costs');
