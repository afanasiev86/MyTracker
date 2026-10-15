import { getConfig } from '../../config.js';
import { domainError } from '../errors.js';

const API = 'https://api.github.com';
const TIMEOUT_MS = 15 * 1000;

// Синхронизация включена, если на сервере задан GITHUB_TOKEN
export const githubEnabled = () => Boolean(getConfig().github.token);

// Запрос к GitHub REST API. Токен не попадает ни в ответ, ни в текст ошибки.
// Ошибки — DomainError: 404 → not_found, 422 → conflict (имя занято), остальное → unavailable.
export async function githubRequest(method, pathname, body) {
  const token = getConfig().github.token;
  if (!token) throw domainError('unavailable', 'GitHub не подключён: задайте GITHUB_TOKEN на сервере');
  let res;
  try {
    res = await fetch(`${API}${pathname}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'mytracker',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw domainError('unavailable', 'Нет связи с GitHub. Попробуйте позже');
  }
  const data = await res.json().catch(() => ({}));
  if (res.ok) return data;
  const message = data.message ? `GitHub: ${data.message}` : `GitHub ответил ошибкой ${res.status}`;
  if (res.status === 404) throw domainError('not_found', 'Репозиторий не найден на GitHub или нет доступа');
  if (res.status === 422) throw domainError('conflict', `GitHub: ${data.errors?.[0]?.message || data.message || 'имя занято'}`);
  throw domainError('unavailable', message);
}
