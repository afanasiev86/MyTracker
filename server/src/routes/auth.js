import { Router } from 'express';
import { z } from 'zod';
import { checkPassword, issueToken } from '../services/auth.js';
import { verifyInitData } from '../services/telegramAuth.js';

const router = Router();

const loginSchema = z.object({ password: z.string().min(1) });
const telegramSchema = z.object({ initData: z.string().min(1) });

router.post('/login', (req, res, next) => {
  try {
    const { password } = loginSchema.parse(req.body);
    if (!checkPassword(password)) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }
    return res.json({ token: issueToken('owner') });
  } catch (err) {
    return next(err);
  }
});

// Вход из Telegram Mini App: подпись проверяется, пароль не нужен
router.post('/telegram', (req, res, next) => {
  try {
    const { initData } = telegramSchema.parse(req.body);
    const check = verifyInitData(initData, process.env.TELEGRAM_BOT_TOKEN);
    if (!check.ok) {
      return res.status(401).json({ error: check.reason });
    }
    if (String(check.user?.id) !== String(process.env.TELEGRAM_OWNER_ID)) {
      return res.status(403).json({ error: 'Этот аккаунт не имеет доступа' });
    }
    return res.json({ token: issueToken('owner') });
  } catch (err) {
    return next(err);
  }
});

export default router;
