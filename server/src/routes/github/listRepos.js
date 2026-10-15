import { githubEnabled, listRepos } from '../../services/github/index.js';

// GET /api/github/repos — репозитории аккаунта для выбора в проекте. Без GITHUB_TOKEN — пустой список и enabled: false
export async function listGithubRepos(_req, res, next) {
  try {
    if (!githubEnabled()) return res.json({ enabled: false, repos: [] });
    return res.json({ enabled: true, repos: await listRepos() });
  } catch (err) {
    return next(err);
  }
}
