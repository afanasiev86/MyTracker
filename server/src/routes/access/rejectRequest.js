import { rejectAccessRequest } from '../../services/access.js';

// POST /api/access/:id/reject
export async function rejectRequest(req, res, next) {
  try {
    await rejectAccessRequest(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}
