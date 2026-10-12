import Task from '../../models/Task.js';

// GET /api/tasks/:id
export async function getTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id).lean();
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    return res.json(task);
  } catch (err) {
    return next(err);
  }
}
