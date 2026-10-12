import { patchTask as applyPatch } from '../../services/tasks/patchTask.js';
import { updateSchema } from './schemas.js';
import { normalize } from './helpers.js';

// PATCH /api/tasks/:id — правка полей и ручной переход статуса (правила в services/tasks/patchTask.js)
export async function patchTask(req, res, next) {
  try {
    const patch = normalize(updateSchema.parse(req.body));
    return res.json(await applyPatch(req.params.id, patch));
  } catch (err) {
    return next(err);
  }
}
