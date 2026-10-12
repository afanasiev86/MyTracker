import path from 'node:path';
import { Router } from 'express';
import { z } from 'zod';
import Task from '../models/Task.js';
import { startTask } from '../services/runs.js';
import { git } from '../worker/git.js';
import { TASK_STATUSES, canTransition } from '../../../shared/statuses.js';

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
    const tasks = await Task.find(filter)
      .sort({ updatedAt: -1 })
      .select('-runs.log')
      .lean();
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
    const patch = updateSchema.parse(req.body);
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });

    if (patch.status && patch.status !== task.status) {
      if (patch.status === 'in_progress') {
        return res.status(409).json({ error: 'Статус «В работе» ставится только запуском задачи' });
      }
      if (!canTransition(task.status, patch.status)) {
        return res.status(409).json({
          error: `Нельзя перевести из «${task.status}» в «${patch.status}»`,
        });
      }
    }

    Object.assign(task, patch);
    await task.save();
    return res.json(task.toObject());
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

// Запуск задачи в Claude: из ready, review (доработка) или failed
router.post('/:id/run', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    const result = await startTask(task);
    if (result.error) return res.status(409).json({ error: result.error });
    return res.status(202).json(result.task.toObject());
  } catch (err) {
    return next(err);
  }
});

// Diff ветки задачи относительно основной ветки
router.get('/:id/diff', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).lean();
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    if (!task.branch) return res.status(404).json({ error: 'Ветка ещё не создана' });

    const repo = path.join(process.env.REPOS_DIR, task.project);
    const base = process.env.DEFAULT_BRANCH || 'main';
    const diff = await git(repo, ['diff', `origin/${base}...${task.branch}`]);
    return res.type('text/plain').send(diff.slice(0, 300000));
  } catch (err) {
    return next(err);
  }
});

export default router;
