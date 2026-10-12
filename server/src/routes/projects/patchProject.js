import { updateProject } from '../../services/store/index.js';
import { projectSchema } from './schemas.js';
import { normalize } from './helpers.js';

// PATCH /api/projects/:id
export async function patchProject(req, res, next) {
  try {
    const patch = normalize(projectSchema.partial().parse(req.body));
    const result = await updateProject(req.params.id, patch);
    if (result.notFound) return res.status(404).json({ error: 'Проект не найден' });
    if (result.conflict) return res.status(409).json({ error: result.conflict });
    return res.json(result.project);
  } catch (err) {
    return next(err);
  }
}
