import { findProject, updateProject } from '../../services/store/index.js';
import { ensureRepo } from '../../services/projects/repo.js';
import { syncWithGithub } from '../../services/projects/githubSync.js';
import { projectSchema } from './schemas.js';
import { normalize } from './helpers.js';

// PATCH /api/projects/:id — если у проекта есть ссылка, а папки нет, повторяет клонирование (repo в ответе).
// Смена ссылки на GitHub подтягивает основную ветку из GitHub; описание и статус уходят в GitHub (github в ответе).
export async function patchProject(req, res, next) {
  try {
    const patch = normalize(projectSchema.partial().parse(req.body));
    const previousRepo = (await findProject(req.params.id))?.repoUrl ?? '';
    const project = await updateProject(req.params.id, patch);
    const sync = await syncWithGithub(project, { pull: previousRepo !== project.repoUrl });
    return res.json({ ...sync.project, repo: await ensureRepo(sync.project), github: sync.github });
  } catch (err) {
    return next(err);
  }
}
