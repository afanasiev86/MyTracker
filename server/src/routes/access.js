import { Router } from 'express';
import { z } from 'zod';
import { listAccessRequests, approveAccessRequest, rejectAccessRequest } from '../services/access.js';

const router = Router();

const approveSchema = z.object({ clientId: z.string().min(1) });

// Запросы доступа, ожидающие решения владельца
router.get('/', async (_req, res, next) => {
  try {
    return res.json(await listAccessRequests());
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/approve', async (req, res, next) => {
  try {
    const { clientId } = approveSchema.parse(req.body);
    const result = await approveAccessRequest(req.params.id, clientId);
    if (result.error) return res.status(result.status).json({ error: result.error });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/reject', async (req, res, next) => {
  try {
    const result = await rejectAccessRequest(req.params.id);
    if (result.error) return res.status(result.status).json({ error: result.error });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

export default router;
