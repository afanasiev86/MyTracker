import { isPortalOpen } from '../../services/access/isPortalOpen.js';

// Доступ мог быть закрыт уже после входа: проверяем на каждом запросе портала
export async function portalGuard(req, res, next) {
  try {
    if (!(await isPortalOpen(req.user.clientId))) {
      return res.status(403).json({ error: 'Доступ к порталу закрыт' });
    }
    return next();
  } catch (err) {
    return next(err);
  }
}
