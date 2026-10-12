import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireOwner } from '../middleware/roles.js';
import { getPublicHealth } from '../services/health/publicHealth.js';
import { getDetails } from '../services/health/details.js';

const router = Router();

// Публичная проверка для мониторинга: 200, если всё работает, иначе 503
router.get('/', async (_req, res, next) => {
  try {
    const health = await getPublicHealth();
    res.status(health.ok ? 200 : 503).json(health);
  } catch (err) {
    next(err);
  }
});

// Подробности для владельца: очередь, активные запуски, зависшие сессии
router.get('/details', requireAuth, requireOwner, async (_req, res, next) => {
  try {
    res.json(await getDetails());
  } catch (err) {
    next(err);
  }
});

export default router;
