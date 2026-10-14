import { updateProject } from '../../services/store/index.js';
import { ensureRepo } from '../../services/projects/repo.js';
import { projectSchema } from './schemas.js';
import { normalize } from './helpers.js';

// PATCH /api/projects/:id — если у проекта есть ссылка, а папки нет, повторяет клонирование (repo в ответе)
export async function patchProject(req, res, next) {
  try {
    const patch = normalize(projectSchema.partial().parse(req.body));
    const project = await updateProject(req.params.id, patch);
    return res.json({ ...project, repo: await ensureRepo(project) });
  } catch (err) {
    return next(err);
  }
}
