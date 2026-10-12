import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { RATE_KINDS, CURRENCIES } from '../../../shared/crm.js';

const router = Router();

const clientSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  rate: z.object({
    kind: z.enum(RATE_KINDS),
    amount: z.number().min(0),
    currency: z.enum(CURRENCIES),
  }).optional(),
});

// Список клиентов со своими проектами и суммой затрат на Claude
router.get('/', async (_req, res, next) => {
  try {
    const [clients, projects, costs] = await Promise.all([
      Client.find().sort({ name: 1 }).lean(),
      Project.find().select('slug name status client').lean(),
      Task.aggregate([
        { $unwind: '$runs' },
        { $group: { _id: '$project', costUsd: { $sum: '$runs.costUsd' } } },
      ]),
    ]);
    const costBySlug = Object.fromEntries(costs.map((c) => [c._id, c.costUsd]));

    res.json(clients.map((client) => {
      const own = projects.filter((p) => String(p.client) === String(client._id));
      return {
        ...client,
        projects: own.map((p) => ({ _id: p._id, slug: p.slug, name: p.name, status: p.status })),
        costUsd: own.reduce((sum, p) => sum + (costBySlug[p.slug] || 0), 0),
      };
    }));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const client = await Client.create(clientSchema.parse(req.body));
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const patch = clientSchema.partial().parse(req.body);
    const client = await Client.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    }).lean();
    if (!client) return res.status(404).json({ error: 'Клиент не найден' });
    return res.json(client);
  } catch (err) {
    return next(err);
  }
});

// Удалить можно только клиента без проектов, чтобы не потерять связи
router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Некорректный ID' });
    }
    const hasProjects = await Project.exists({ client: req.params.id });
    if (hasProjects) {
      return res.status(409).json({ error: 'Сначала переназначьте или удалите проекты клиента' });
    }
    const result = await Client.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Клиент не найден' });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

export default router;
