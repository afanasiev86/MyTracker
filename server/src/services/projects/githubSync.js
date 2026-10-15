import { updateProject } from '../store/index.js';
import { githubEnabled, createRepo, getRepo, updateRepo, githubFullName } from '../github/index.js';

// Связь CRM и GitHub. Кто чем владеет:
// - CRM → GitHub: при создании проекта без ссылки создаётся приватный репозиторий с кодом проекта;
//   описание и архивация (статус «Завершён») отправляются при каждом сохранении.
// - GitHub → CRM: основная ветка и описание (если в CRM пусто) подтягиваются при смене ссылки
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
      const repo = await gh.createRepo({ name: project.slug, description: project.description });
      current = await deps.save(project._id, { repoUrl: repo.sshUrl, defaultBranch: repo.defaultBranch });
      return { project: current, github: { status: 'created', fullName: repo.fullName } };
    }
    const fullName = gh.fullName(project.repoUrl);
    if (!fullName) return { project, github: { status: 'none' } };

    if (pull) {
      const repo = await gh.getRepo(fullName);
      const patch = { defaultBranch: repo.defaultBranch };
      if (!project.description && repo.description) patch.description = repo.description;
      current = await deps.save(project._id, patch);
    }
    await gh.updateRepo(fullName, { description: current.description, archived: current.status === 'done' });
    return { project: current, github: { status: 'synced', fullName } };
  } catch (err) {
    return { project: current, github: { status: 'failed', error: err.message } };
  }
}
