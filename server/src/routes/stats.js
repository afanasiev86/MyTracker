import { Router } from 'express';
import Task from '../models/Task.js';

const router = Router();

// Суммарная стоимость запусков по проектам
router.get('/costs', async (_req, res, next) => {
  try {
    const rows = await Task.aggregate([
      { $unwind: '$runs' },
      {
        $group: {
          _id: '$project',
          costUsd: { $sum: '$runs.costUsd' },
          runs: { $sum: 1 },
        },
      },
      { $sort: { costUsd: -1 } },
    ]);
    res.json(rows.map((r) => ({ project: r._id, costUsd: r.costUsd, runs: r.runs })));
  } catch (err) {
    next(err);
  }
});

export default router;
