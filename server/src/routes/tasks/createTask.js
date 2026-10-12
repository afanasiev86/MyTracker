import { createTask as saveNewTask } from '../../services/store/tasks.js';
import { assertProjectExists } from '../../services/tasks/assertProjectExists.js';
import { createSchema } from './schemas.js';
import { normalize } from './helpers.js';

// POST /api/tasks — создание задачи в существующем проекте
export async function createTask(req, res, next) {
  try {
    const data = normalize(createSchema.parse(req.body));
    await assertProjectExists(data.project);
    const task = await saveNewTask(data);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}
