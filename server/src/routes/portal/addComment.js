import { addClientComment } from '../../services/portal/addClientComment.js';
import { commentSchema } from './schemas.js';

// POST /api/portal/tasks/:id/comments — комментарий заказчика к задаче
export async function addComment(req, res, next) {
  try {
    const { text } = commentSchema.parse(req.body);
    await addClientComment(req.user.clientId, req.params.id, text);
    return res.status(201).json({ ok: true });
  } catch (err) {
    return next(err);
  }
}
