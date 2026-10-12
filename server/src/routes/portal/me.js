import Client from '../../models/Client.js';

// GET /api/portal/me — имя заказчика для шапки портала
export async function me(req, res, next) {
  try {
    const client = await Client.findById(req.user.clientId).select('name').lean();
    if (!client) return res.status(404).json({ error: 'Профиль не найден' });
    return res.json({ name: client.name });
  } catch (err) {
    return next(err);
  }
}
