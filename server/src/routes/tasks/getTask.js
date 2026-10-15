import { findTaskLean } from '../../services/store/tasks.js';
import { standInfo } from '../../services/uat/standInfo.js';

// GET /api/tasks/:id (вместе с состоянием UAT-стенда проекта)
export async function getTask(req, res, next) {
  try {
    const task = await findTaskLean(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    return res.json({ ...task, stand: await standInfo(task.project) });
  } catch (err) {
    return next(err);
  }
}
