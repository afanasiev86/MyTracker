import { getToken, UNAUTHORIZED_EVENT } from './session.js';

// Заголовки с токеном, если он есть
export function authHeaders(extra = {}) {
  const headers = { ...extra };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function networkError() {
  return new Error('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.');
}

export function httpError(status, message) {
  const error = new Error(message || `Ошибка ${status}`);
  error.status = status;
  return error;
}

// Основной запрос JSON к /api. Ошибки сети и HTTP превращаются в понятные Error.
export async function request(path, { method = 'GET', body } = {}) {
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
