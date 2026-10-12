import { listTasks as findTasks } from '../../services/store/tasks.js';
import { escapeRegex } from './helpers.js';

// GET /api/tasks — фильтры project, status и поиск q по названию
export async function listTasks(req, res, next) {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.q) filter.title = { $regex: escapeRegex(String(req.query.q)), $options: 'i' };
    res.json(await findTasks(filter));
  } catch (err) {
    next(err);
  }
}
