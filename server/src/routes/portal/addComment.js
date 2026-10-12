import { addClientComment } from '../../services/portal.js';
import { commentSchema } from './schemas.js';

// POST /api/portal/tasks/:id/comments — комментарий заказчика к задаче
export async function addComment(req, res, next) {
  try {
    const { text } = commentSchema.parse(req.body);
    const result = await addClientComment(req.user.clientId, req.params.id, text);
    if (result.notFound) return res.status(404).json({ error: 'Задача не найдена' });
    return res.status(201).json({ ok: true });
  } catch (err) {
    return next(err);
  }
}
