import { findClientName } from '../../services/store/index.js';

// GET /api/portal/me — имя заказчика для шапки портала
export async function me(req, res, next) {
  try {
    const client = await findClientName(req.user.clientId);
    if (!client) return res.status(404).json({ error: 'Профиль не найден' });
    return res.json({ name: client.name });
  } catch (err) {
    return next(err);
  }
}
