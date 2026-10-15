import { updateProject } from '../store/index.js';
import { githubEnabled, createRepo, getRepo, updateRepo, githubFullName } from '../github/index.js';

// Связь CRM и GitHub. Кто чем владеет:
// - CRM → GitHub: при создании проекта без ссылки создаётся приватный репозиторий с кодом проекта
//   (в проект записывается https-ссылка: клонирование и push идут с токеном из «Настроек»);
//   архивация (статус «Завершён») отправляется при каждом сохранении.
// - GitHub → CRM: основная ветка подтягивается при смене ссылки
//   и по кнопке синхронизации.
// Удаление проекта в CRM репозиторий на GitHub не трогает.
// Ошибки GitHub не отменяют сохранение проекта: они возвращаются в поле github.
const defaultDeps = {
  save: updateProject,
  github: { enabled: githubEnabled, createRepo, getRepo, updateRepo, fullName: githubFullName },
};

// project — плоский объект проекта с _id. Возвращает { project, github: { status, ... } }
export async function syncWithGithub(project, { created = false, pull = false } = {}, deps = defaultDeps) {
  const gh = deps.github;
  if (!gh.enabled()) return { project, github: { status: 'disabled' } };
  let current = project;
  try {
    if (created && !project.repoUrl) {
      const repo = await gh.createRepo({ name: project.slug });
      current = await deps.save(project._id, { repoUrl: repo.httpsUrl, defaultBranch: repo.defaultBranch });
      return { project: current, github: { status: 'created', fullName: repo.fullName } };
    }
    const fullName = gh.fullName(project.repoUrl);
    if (!fullName) return { project, github: { status: 'none' } };

    if (pull) {
      const repo = await gh.getRepo(fullName);
      current = await deps.save(project._id, { defaultBranch: repo.defaultBranch });
    }
    await gh.updateRepo(fullName, { archived: current.status === 'done' });
    return { project: current, github: { status: 'synced', fullName } };
  } catch (err) {
    return { project: current, github: { status: 'failed', error: err.message } };
  }
}
