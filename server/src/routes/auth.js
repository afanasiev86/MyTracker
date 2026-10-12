import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { login } from './auth/login.js';
import { telegramLogin } from './auth/telegramLogin.js';
import { revokeSessions } from './auth/revokeSessions.js';

// Маршруты входа. Каждый обработчик лежит в своём файле папки auth/.
const router = Router();

router.post('/login', login);
router.post('/telegram', telegramLogin);
router.post('/revoke', requireAuth, revokeSessions);

export default router;
