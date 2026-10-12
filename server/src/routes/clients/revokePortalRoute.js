import { revokePortal } from '../../services/access.js';

// POST /api/clients/:id/portal/revoke — закрыть клиенту доступ к порталу (отвязать его Telegram)
export async function revokePortalRoute(req, res, next) {
  try {
    if (!(await revokePortal(req.params.id))) return res.status(404).json({ error: 'Клиент не найден' });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}
