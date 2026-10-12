import { rejectAccessRequest } from '../../services/access.js';

// POST /api/access/:id/reject
export async function rejectRequest(req, res, next) {
  try {
    const result = await rejectAccessRequest(req.params.id);
    if (result.error) return res.status(result.status).json({ error: result.error });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}
