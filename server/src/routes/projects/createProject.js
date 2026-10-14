import { createProject as saveProject } from '../../services/store/index.js';
import { uniqueSlug } from '../../services/projects/slug.js';
import { ensureRepo } from '../../services/projects/repo.js';
import { projectSchema } from './schemas.js';
import { normalize } from './helpers.js';

// POST /api/projects — код проекта строится из названия, репозиторий клонируется в папку проекта.
// В ответе repo: итог клонирования (none, exists, cloned, failed).
export async function createProject(req, res, next) {
  try {
    const data = normalize(projectSchema.parse(req.body));
    const project = await saveProject({ ...data, slug: data.slug || await uniqueSlug(data.name) });
    res.status(201).json({ ...project.toObject(), repo: await ensureRepo(project) });
  } catch (err) {
    next(err);
  }
}
