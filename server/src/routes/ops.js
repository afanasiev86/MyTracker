import { Router } from 'express';
import { z } from 'zod';
import { findService } from '../services/ops/catalog.js';
import { getOpsStatus } from '../services/ops/status.js';
import { controlService } from '../services/ops/control.js';
import { readLogs } from '../services/ops/logs.js';
import { startDeploy } from '../services/ops/deploy.js';
import { domainError } from '../services/errors.js';

const router = Router();

const actionSchema = z.enum(['restart', 'start', 'stop']);

function serviceParam(req) {
  if (!findService(req.params.id)) throw domainError('not_found', 'Неизвестный сервис');
  return req.params.id;
}

// Метрики, состояние сервисов и обновления
router.get('/', async (_req, res, next) => {
  try {
    return res.json(await getOpsStatus());
  } catch (err) {
    return next(err);
  }
});

// Журнал сервиса: последние строки
router.get('/services/:id/logs', async (req, res, next) => {
  try {
    return res.json({ text: await readLogs(serviceParam(req), req.query.lines) });
  } catch (err) {
    return next(err);
  }
});

// Перезапуск, запуск или остановка сервиса из списка
router.post('/services/:id/:action', async (req, res, next) => {
  try {
    const id = serviceParam(req);
    return res.json(await controlService(id, actionSchema.parse(req.params.action)));
  } catch (err) {
    return next(err);
  }
});

// Обновление MyTracker с GitHub
router.post('/deploy', async (_req, res, next) => {
  try {
    await startDeploy();
    return res.status(202).json({ started: true });
  } catch (err) {
    return next(err);
  }
});

export default router;
