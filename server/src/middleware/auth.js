import { verifyToken } from '../services/auth/tokens.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Нужна авторизация' });
  }
  try {
    req.user = await verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Токен недействителен. Войдите снова.' });
  }
}
