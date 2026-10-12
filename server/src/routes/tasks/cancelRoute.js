import { findTask } from '../../services/store/tasks.js';
import { cancelTask } from '../../services/runs/cancelTask.js';

// POST /api/tasks/:id/cancel — отмена запуска, который идёт сейчас
export async function cancelRoute(req, res, next) {
  try {
    const task = await findTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    const result = await cancelTask(task);
    if (result.error) return res.status(409).json({ error: result.error });
    return res.status(202).json({ stopping: result.stopping, task: result.task.toObject() });
  } catch (err) {
    return next(err);
  }
}
