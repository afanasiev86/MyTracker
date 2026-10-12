import { findTaskLean } from '../../services/store/tasks.js';
import { taskDiff } from '../../services/diff.js';

// GET /api/tasks/:id/diff — diff ветки задачи относительно основной
export async function diffRoute(req, res, next) {
  try {
    const task = await findTaskLean(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    if (!task.branch) return res.status(404).json({ error: 'Ветка ещё не создана' });

    return res.type('text/plain').send(await taskDiff(task));
  } catch (err) {
    return next(err);
  }
}
