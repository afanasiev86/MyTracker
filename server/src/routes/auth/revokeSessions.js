import { revokeAllTokens } from '../../services/auth/tokenVersion.js';

// POST /api/auth/revoke — выход на всех устройствах: все токены перестают работать
export async function revokeSessions(_req, res, next) {
  try {
    await revokeAllTokens();
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}
