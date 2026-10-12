import { updateProject } from '../../services/store/index.js';
import { projectSchema } from './schemas.js';
import { normalize } from './helpers.js';

// PATCH /api/projects/:id
export async function patchProject(req, res, next) {
  try {
    const patch = normalize(projectSchema.partial().parse(req.body));
    return res.json(await updateProject(req.params.id, patch));
  } catch (err) {
    return next(err);
  }
}
