import { Router } from 'express';
import { z } from 'zod';
import Task, { TASK_STATUSES } from '../models/Task.js';

const router = Router();

const createSchema = z.object({
  project: z.string().min(1),
  title: z.string().min(1),
  goal: z.string().optional(),
  acceptance: z.array(z.string()).optional(),
  context: z.string().optional(),
  outOfScope: z.string().optional(),
});

const updateSchema = createSchema.partial().extend({
  status: z.enum(TASK_STATUSES).optional(),
  branch: z.string().optional(),
});

const commentSchema = z.object({ text: z.string().min(1) });

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    if (req.query.status) filter.status = req.query.status;
    const tasks = await Task.find(filter).sort({ updatedAt: -1 }).select('-runs.log').lean();
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const task = await Task.create(createSchema.parse(req.body));
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).lean();
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    return res.json(task);
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateSchema.parse(req.body),
      { new: true, runValidators: true },
    ).lean();
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    return res.json(task);
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/comments', async (req, res, next) => {
  try {
    const { text } = commentSchema.parse(req.body);
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { text } } },
      { new: true },
    ).lean();
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    return res.status(201).json(task.comments.at(-1));
  } catch (err) {
    return next(err);
  }
});

export default router;
