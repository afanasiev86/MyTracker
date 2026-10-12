import { patchTask as applyPatch } from '../../services/tasks/patchTask.js';
import { updateSchema } from './schemas.js';
import { normalize } from './helpers.js';

// PATCH /api/tasks/:id — правка полей и ручной переход статуса (правила в services/tasks/patchTask.js)
export async function patchTask(req, res, next) {
  try {
    const patch = normalize(updateSchema.parse(req.body));
    const result = await applyPatch(req.params.id, patch);
    if (result.notFound) return res.status(404).json({ error: 'Задача не найдена' });
    if (result.error) return res.status(409).json({ error: result.error });
    return res.json(result.task);
  } catch (err) {
    return next(err);
  }
}
