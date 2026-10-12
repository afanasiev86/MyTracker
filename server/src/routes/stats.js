import { Router } from 'express';
import { runCostsByProject } from '../services/store/index.js';

const router = Router();

// Суммарная стоимость запусков по проектам
router.get('/costs', async (_req, res, next) => {
  try {
    res.json(await runCostsByProject());
  } catch (err) {
    next(err);
  }
});

export default router;
