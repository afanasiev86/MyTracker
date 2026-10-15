import { request } from './http.js';

// Репозитории аккаунта GitHub для выбора в проекте: { enabled, repos }
export const fetchGithubRepos = () => request('/github/repos');
