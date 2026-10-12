import { findTask } from '../../services/store/tasks.js';
import { startTask } from '../../services/runs.js';

// POST /api/tasks/:id/run — запуск в Claude из ready, review (доработка) или failed
export async function runTaskRoute(req, res, next) {
  try {
    const task = await findTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    const result = await startTask(task);
    if (result.error) return res.status(409).json({ error: result.error });
    return res.status(202).json(result.task.toObject());
  } catch (err) {
    return next(err);
  }
}
