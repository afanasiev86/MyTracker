import { createProject as saveProject } from '../../services/store/index.js';
import { uniqueSlug } from '../../services/projects/slug.js';
import { ensureRepo } from '../../services/projects/repo.js';
import { syncWithGithub } from '../../services/projects/githubSync.js';
import { projectSchema } from './schemas.js';
import { normalize } from './helpers.js';

// POST /api/projects — код проекта строится из названия, репозиторий клонируется в папку проекта.
// Без ссылки создаётся репозиторий на GitHub (если задан GITHUB_TOKEN). В ответе repo: итог клонирования, github: итог синхронизации.
export async function createProject(req, res, next) {
  try {
    const data = normalize(projectSchema.parse(req.body));
    const project = await saveProject({ ...data, slug: data.slug || await uniqueSlug(data.name) });
    const sync = await syncWithGithub(project.toObject(), { created: true, pull: Boolean(project.repoUrl) });
    res.status(201).json({ ...sync.project, repo: await ensureRepo(sync.project), github: sync.github });
  } catch (err) {
    next(err);
  }
}
