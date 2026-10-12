import Project from '../../models/Project.js';
import Task from '../../models/Task.js';
import { projectSchema } from './schemas.js';
import { normalize } from './helpers.js';

// PATCH /api/projects/:id
export async function patchProject(req, res, next) {
  try {
    const patch = normalize(projectSchema.partial().parse(req.body));
    const current = await Project.findById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Проект не найден' });

    // Slug нельзя менять, если по нему уже есть задачи: они привязаны к нему
    if (patch.slug && patch.slug !== current.slug && await Task.exists({ project: current.slug })) {
      return res.status(409).json({ error: 'Нельзя переименовать slug: в проекте есть задачи' });
    }

    Object.assign(current, patch);
    await current.save();
    return res.json(current.toObject());
  } catch (err) {
    return next(err);
  }
}
