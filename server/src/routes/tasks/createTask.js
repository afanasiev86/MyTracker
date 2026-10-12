import Task from '../../models/Task.js';
import { createSchema } from './schemas.js';
import { normalize, assertProjectExists } from './helpers.js';

// POST /api/tasks — создание задачи в существующем проекте
export async function createTask(req, res, next) {
  try {
    const data = normalize(createSchema.parse(req.body));
    await assertProjectExists(data.project);
    const task = await Task.create(data);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}
