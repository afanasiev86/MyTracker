import { findTaskLean } from '../../services/store/tasks.js';

// GET /api/tasks/:id
export async function getTask(req, res, next) {
  try {
    const task = await findTaskLean(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    return res.json(task);
  } catch (err) {
    return next(err);
  }
}
