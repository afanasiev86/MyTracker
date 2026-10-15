import express from 'express';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import statsRoutes from './routes/stats.js';
import clientRoutes from './routes/clients.js';
import telegramRoutes from './routes/telegram.js';
import opsRoutes from './routes/ops.js';
import projectRoutes from './routes/projects.js';
import githubRoutes from './routes/github.js';
import claudeRoutes from './routes/claude.js';
import { requireAuth } from './middleware/auth.js';
import { requireOwner, requireClient } from './middleware/roles.js';
import portalRoutes from './routes/portal.js';
import accessRoutes from './routes/access.js';
import healthRoutes from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';

// Попытки входа ограничены: 10 за 15 минут с одного адреса
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток входа. Подождите 15 минут.' },
});

export function createApp() {
  const app = express();
  // За nginx берём адрес клиента из X-Forwarded-For
  app.set('trust proxy', 1);
  // CORS не нужен: клиент и API работают на одном домене (nginx или Vite proxy)
  app.use(express.json({ limit: '1mb' }));

  // Здоровье: публичная проверка и подробности только для владельца
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', loginLimiter, authRoutes);
  // Владельческий API: заказчик сюда не попадает
  app.use('/api/tasks', requireAuth, requireOwner, taskRoutes);
  app.use('/api/projects', requireAuth, requireOwner, projectRoutes);
  app.use('/api/clients', requireAuth, requireOwner, clientRoutes);
  app.use('/api/github', requireAuth, requireOwner, githubRoutes);
  app.use('/api/claude', requireAuth, requireOwner, claudeRoutes);
  app.use('/api/stats', requireAuth, requireOwner, statsRoutes);
  app.use('/api/telegram', requireAuth, requireOwner, telegramRoutes);
  app.use('/api/ops', requireAuth, requireOwner, opsRoutes);
  app.use('/api/access', requireAuth, requireOwner, accessRoutes);
  // Портал заказчика: только свои данные
  app.use('/api/portal', requireAuth, requireClient, portalRoutes);

  app.use((_req, res) => res.status(404).json({ error: 'Не найдено' }));
  app.use(errorHandler);
  return app;
}
