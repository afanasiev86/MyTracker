import Task from '../../models/Task.js';
import { canTransition } from '../../../../shared/statuses.js';
import { updateSchema } from './schemas.js';
import { normalize, assertProjectExists } from './helpers.js';

// PATCH /api/tasks/:id — правка полей и ручной переход статуса
export async function patchTask(req, res, next) {
  try {
    const patch = normalize(updateSchema.parse(req.body));
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });

    if (patch.project && patch.project !== task.project) {
      await assertProjectExists(patch.project);
    }

    if (patch.status && patch.status !== task.status) {
      if (patch.status === 'in_progress') {
        return res.status(409).json({ error: 'Статус «В работе» ставится только запуском задачи' });
      }
      if (!canTransition(task.status, patch.status)) {
        return res.status(409).json({
          error: `Нельзя перевести из «${task.status}» в «${patch.status}»`,
        });
      }
    }

    Object.assign(task, patch);
    await task.save();
    return res.json(task.toObject());
  } catch (err) {
    return next(err);
  }
}
