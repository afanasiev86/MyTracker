import { issueToken } from '../../services/auth/tokens.js';
import { verifyInitData } from '../../services/telegramAuth.js';
import { findClientByTelegramId } from '../../services/store/index.js';
import { telegramSchema } from './schemas.js';
import { getConfig } from '../../config.js';

// POST /api/auth/telegram — вход из Telegram Mini App: владелец или привязанный заказчик.
// Подпись проверяется, пароль не нужен.
export async function telegramLogin(req, res, next) {
  try {
    const { initData } = telegramSchema.parse(req.body);
    const check = verifyInitData(initData, getConfig().telegram.botToken);
    if (!check.ok) {
      return res.status(401).json({ error: check.reason });
    }
    const telegramId = String(check.user?.id);
    if (telegramId === String(getConfig().telegram.ownerId)) {
      return res.json({ token: await issueToken('owner'), role: 'owner' });
    }
    const client = await findClientByTelegramId(telegramId);
    if (client && !client.portalApproved) {
      return res.status(403).json({ error: 'Доступ ещё не подтверждён исполнителем' });
    }
    if (client) {
      const claims = { role: 'client', clientId: String(client._id) };
      return res.json({ token: await issueToken(`client:${client._id}`, '30d', claims), role: 'client' });
    }
    return res.status(403).json({ error: 'Этот аккаунт не имеет доступа' });
  } catch (err) {
    return next(err);
  }
}
