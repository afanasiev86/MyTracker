// Все запросы к API проходят через этот модуль

const TOKEN_KEY = 'mytracker_token';
const ROLE_KEY = 'mytracker_role';

// Событие для всего приложения: токен истёк или недействителен
export const UNAUTHORIZED_EVENT = 'mytracker:unauthorized';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
};

// Роль: owner (владелец) или client (заказчик с порталом). По умолчанию владелец.
export const getRole = () => localStorage.getItem(ROLE_KEY) || 'owner';
export const setRole = (role) => localStorage.setItem(ROLE_KEY, role);

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
export const addComment = (id, text, visibleToClient = false) =>
  request(`/tasks/${id}/comments`, { method: 'POST', body: { text, visibleToClient } });
export const runTask = (id) => request(`/tasks/${id}/run`, { method: 'POST' });
export const answerTask = (id, text) =>
  request(`/tasks/${id}/answer`, { method: 'POST', body: { text } });
export const cancelTask = (id) => request(`/tasks/${id}/cancel`, { method: 'POST' });

// Все выданные токены перестают работать (выход на всех устройствах)
export const revokeAllSessions = () => request('/auth/revoke', { method: 'POST' });

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

// Вложения: файл отправляется как есть, тип и имя передаются в заголовках
export async function uploadAttachment(id, file) {
  let res;
  try {
    res = await fetch(`/api/tasks/${id}/attachments`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) }),
      body: file,
    });
  } catch {
    throw networkError();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw httpError(res.status, data.error);
  return data;
}

// Картинка вложения: <img> не умеет передавать заголовок с токеном, поэтому берём blob
export async function fetchAttachmentUrl(id, attachmentId) {
  let res;
  try {
    res = await fetch(`/api/tasks/${id}/attachments/${attachmentId}`, { headers: authHeaders() });
  } catch {
    throw networkError();
  }
  if (!res.ok) throw httpError(res.status);
  return URL.createObjectURL(await res.blob());
}

// Хранилище вложений: какой провайдер активен и какие настроены
export const fetchStorage = () => request('/storage');
export const saveStorage = (provider) => request('/storage', { method: 'PUT', body: { provider } });

// Состояние сервисов и запусков (только владелец)
export const fetchHealthDetails = () => request('/health/details');

// Запросы доступа к порталу (владелец)
export const fetchAccessRequests = () => request('/access');
export const approveAccessRequest = (id, clientId) =>
  request(`/access/${id}/approve`, { method: 'POST', body: { clientId } });
export const rejectAccessRequest = (id) => request(`/access/${id}/reject`, { method: 'POST' });
export const revokeClientPortal = (id) => request(`/clients/${id}/portal/revoke`, { method: 'POST' });

// Портал заказчика
export const fetchPortalMe = () => request('/portal/me');
export const fetchPortalTasks = () => request('/portal/tasks');
export const postPortalComment = (taskId, text) =>
  request(`/portal/tasks/${taskId}/comments`, { method: 'POST', body: { text } });
