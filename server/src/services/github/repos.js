import { githubRequest } from './api.js';

// Страниц по 100 репозиториев; больше 1000 для трекера не нужно
const PER_PAGE = 100;
const MAX_PAGES = 10;

// Поля репозитория, которые нужны трекеру (без лишнего из ответа GitHub)
export function toRepoInfo(r) {
  return {
    fullName: r.full_name,
    name: r.name,
    description: r.description ?? '',
    private: Boolean(r.private),
    archived: Boolean(r.archived),
    defaultBranch: r.default_branch || 'main',
    pushedAt: r.pushed_at ?? null,
    // https работает с токеном из «Настроек», ssh требует ключ на сервере
    httpsUrl: r.clone_url,
    sshUrl: r.ssh_url,
  };
}

// Ссылка на репозиторий GitHub → «владелец/имя». Для других хостов и локальных адресов — null.
const GITHUB_URL = /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/;
export function githubFullName(url) {
  const match = GITHUB_URL.exec(url ?? '');
  return match ? `${match[1]}/${match[2]}` : null;
}

// Репозитории аккаунта владельца токена, новые по дате последнего пуша сверху
export async function listRepos() {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const batch = await githubRequest('GET', `/user/repos?per_page=${PER_PAGE}&page=${page}&sort=pushed`);
    all.push(...batch.map(toRepoInfo));
    if (batch.length < PER_PAGE) break;
  }
  return all;
}

export async function getRepo(fullName) {
  return toRepoInfo(await githubRequest('GET', `/repos/${fullName}`));
}

// Приватный репозиторий с веткой main (auto_init), иначе задачи не смогут создать рабочую ветку
export async function createRepo({ name, description }) {
  const repo = await githubRequest('POST', '/user/repos', {
    name,
    description: description || undefined,
    private: true,
    auto_init: true,
  });
  return toRepoInfo(repo);
}

// Меняем только то, что CRM задаёт: описание и архивацию
export async function updateRepo(fullName, { description, archived }) {
  const repo = await githubRequest('PATCH', `/repos/${fullName}`, { description, archived });
  return toRepoInfo(repo);
}
