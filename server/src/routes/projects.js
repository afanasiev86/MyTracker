import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { PROJECT_STATUSES, CURRENCIES, SLUG_PATTERN } from '../../../shared/crm.js';

const router = Router();

const linkSchema = z.object({ title: z.string().min(1), url: z.string().url() });

const projectSchema = z.object({
  slug: z.string().regex(SLUG_PATTERN, 'Латиница, цифры и дефис, например shop-api'),
  name: z.string().min(1),
  client: z.string().nullable().optional(),
  description: z.string().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  repoUrl: z.string().optional(),
  defaultBranch: z.string().optional(),
  deadline: z.string().nullable().optional(),
  price: z.object({
    amount: z.number().min(0),
    currency: z.enum(CURRENCIES),
  }).optional(),
  links: z.array(linkSchema).optional(),
});

function normalize(data) {
  const out = { ...data };
  if (out.deadline !== undefined) out.deadline = out.deadline ? new Date(out.deadline) : null;
  if (out.client === '') out.client = null;
  return out;
}

// Стоимость и количество задач по каждому проекту
async function taskStats() {
  const rows = await Task.aggregate([
    {
      $group: {
        _id: '$project',
        tasks: { $sum: 1 },
        open: { $sum: { $cond: [{ $ne: ['$status', 'done'] }, 1, 0] } },
        runs: { $push: '$runs' },
      },
    },
  ]);
  return Object.fromEntries(rows.map((r) => {
    const costUsd = r.runs.flat().reduce((sum, run) => sum + (run.costUsd || 0), 0);
    return [r._id, { tasks: r.tasks, open: r.open, costUsd }];
  }));
}

router.get('/', async (_req, res, next) => {
  try {
    const [projects, stats] = await Promise.all([
      Project.find().sort({ name: 1 }).populate('client', 'name').lean(),
      taskStats(),
    ]);
    res.json(projects.map((p) => ({
      ...p,
      stats: stats[p.slug] || { tasks: 0, open: 0, costUsd: 0 },
    })));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Некорректный ID' });
    }
    const project = await Project.findById(req.params.id).populate('client', 'name').lean();
    if (!project) return res.status(404).json({ error: 'Проект не найден' });
    const tasks = await Task.find({ project: project.slug })
      .sort({ updatedAt: -1 })
      .select('-runs.log')
      .lean();
    const stats = (await taskStats())[project.slug] || { tasks: 0, open: 0, costUsd: 0 };
    return res.json({ ...project, tasks, stats });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const project = await Project.create(normalize(projectSchema.parse(req.body)));
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const patch = normalize(projectSchema.partial().parse(req.body));
    const current = await Project.findById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Проект не найден' });

    // Slug нельзя менять, если по нему уже есть задачи: они привязаны к нему
    if (patch.slug && patch.slug !== current.slug && await Task.exists({ project: current.slug })) {
      return res.status(409).json({ error: 'Нельзя переименовать slug: в проекте есть задачи' });
    }

    Object.assign(current, patch);
    await current.save();
    return res.json(current.toObject());
  } catch (err) {
    return next(err);
  }
});

// Удалить можно только пустой проект
router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Некорректный ID' });
    }
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Проект не найден' });
    if (await Task.exists({ project: project.slug })) {
      return res.status(409).json({ error: 'В проекте есть задачи, удалить нельзя' });
    }
    await project.deleteOne();
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

export default router;
