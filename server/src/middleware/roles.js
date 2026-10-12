// Роли токена: у владельца и воркера роли нет (или она не client), у заказчика role = 'client'.
// Владельческий API закрыт для заказчика, портал — только для него.

export function requireOwner(req, res, next) {
  if (req.user?.role === 'client') {
    return res.status(403).json({ error: 'Этот раздел доступен только владельцу' });
  }
  return next();
}

export function requireClient(req, res, next) {
  if (req.user?.role !== 'client') {
    return res.status(403).json({ error: 'Этот раздел доступен только заказчику' });
  }
  return next();
}
