import { addTaskComment } from '../../services/store/tasks.js';
import { commentSchema } from './schemas.js';

// POST /api/tasks/:id/comments — комментарий владельца, видимость заказчику — по флагу
export async function addComment(req, res, next) {
  try {
    const { text, visibleToClient } = commentSchema.parse(req.body);
    const task = await addTaskComment(req.params.id, { text, visibleToClient: Boolean(visibleToClient) });
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    return res.status(201).json(task.comments.at(-1));
  } catch (err) {
    return next(err);
  }
}
