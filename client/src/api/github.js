import { request } from './http.js';

// GitHub: состояние подключения (токен сервер не отдаёт), подключение и отключение
export const fetchGithub = () => request('/github');
export const saveGithub = (token) => request('/github', { method: 'PUT', body: { token } });
export const deleteGithub = () => request('/github', { method: 'DELETE' });
// Репозитории аккаунта GitHub для выбора в проекте: { enabled, repos }
export const fetchGithubRepos = () => request('/github/repos');
