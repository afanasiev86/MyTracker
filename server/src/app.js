import express from 'express';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import statsRoutes from './routes/stats.js';
import clientRoutes from './routes/clients.js';
import storageRoutes from './routes/storage.js';
import projectRoutes from './routes/projects.js';
import { requireAuth } from './middleware/auth.js';
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

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', loginLimiter, authRoutes);
  app.use('/api/tasks', requireAuth, taskRoutes);
  app.use('/api/projects', requireAuth, projectRoutes);
  app.use('/api/clients', requireAuth, clientRoutes);
  app.use('/api/stats', requireAuth, statsRoutes);
  app.use('/api/storage', requireAuth, storageRoutes);

  app.use((_req, res) => res.status(404).json({ error: 'Не найдено' }));
  app.use(errorHandler);
  return app;
}
