import { issueToken } from '../../services/auth.js';
import { verifyInitData } from '../../services/telegramAuth.js';
import Client from '../../models/Client.js';
import { telegramSchema } from './schemas.js';

// POST /api/auth/telegram — вход из Telegram Mini App: владелец или привязанный заказчик.
// Подпись проверяется, пароль не нужен.
export async function telegramLogin(req, res, next) {
  try {
    const { initData } = telegramSchema.parse(req.body);
    const check = verifyInitData(initData, process.env.TELEGRAM_BOT_TOKEN);
    if (!check.ok) {
      return res.status(401).json({ error: check.reason });
    }
    const telegramId = String(check.user?.id);
    if (telegramId === String(process.env.TELEGRAM_OWNER_ID)) {
      return res.json({ token: await issueToken('owner'), role: 'owner' });
    }
    const client = await Client.findOne({ telegramId }).select('_id portalApproved').lean();
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
