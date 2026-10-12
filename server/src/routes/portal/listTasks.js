import { clientTasks } from '../../services/portal/clientTasks.js';

// GET /api/portal/tasks — задачи заказчика
export async function listTasks(req, res, next) {
  try {
    return res.json(await clientTasks(req.user.clientId));
  } catch (err) {
    return next(err);
  }
}
