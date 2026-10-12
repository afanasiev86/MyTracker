import { approveAccessRequest } from '../../services/access.js';
import { approveSchema } from './schemas.js';

// POST /api/access/:id/approve
export async function approveRequest(req, res, next) {
  try {
    const { clientId } = approveSchema.parse(req.body);
    const result = await approveAccessRequest(req.params.id, clientId);
    if (result.error) return res.status(result.status).json({ error: result.error });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}
