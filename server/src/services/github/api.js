import { domainError } from '../errors.js';
import { getGithubToken } from './settings.js';

const API = 'https://api.github.com';
const TIMEOUT_MS = 15 * 1000;

// Синхронизация включена, если токен задан в настройках или в GITHUB_TOKEN на сервере
export const githubEnabled = () => Boolean(getGithubToken());

// Запрос к GitHub REST API. Токен не попадает ни в ответ, ни в текст ошибки.
// Своим токеном (tokenOverride) проверяют ввод в настройках до сохранения.
// Ошибки — DomainError: 401 → invalid, 404 → not_found, 422 → conflict (имя занято), остальное → unavailable.
export async function githubRequest(method, pathname, body, tokenOverride) {
  const token = tokenOverride || getGithubToken();
  if (!token) throw domainError('unavailable', 'GitHub не подключён: добавьте токен в «Настройках»');
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
  if (res.status === 401) throw domainError('invalid', 'GitHub не принял токен. Проверьте, что он скопирован целиком и не истёк.');
  if (res.status === 404) throw domainError('not_found', 'Репозиторий не найден на GitHub или нет доступа');
  if (res.status === 422) throw domainError('conflict', `GitHub: ${data.errors?.[0]?.message || data.message || 'имя занято'}`);
  throw domainError('unavailable', message);
}
