import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import statsRoutes from './routes/stats.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', requireAuth, taskRoutes);
  app.use('/api/stats', requireAuth, statsRoutes);

  app.use((_req, res) => res.status(404).json({ error: 'Не найдено' }));
  app.use(errorHandler);
  return app;
}
