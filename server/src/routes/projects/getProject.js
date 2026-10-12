import mongoose from 'mongoose';
import { findProjectWithClient, listProjectTasks, taskStatsByProject } from '../../services/store/index.js';

// GET /api/projects/:id — проект с задачами и статистикой
export async function getProject(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Некорректный ID' });
    }
    const project = await findProjectWithClient(req.params.id);
    if (!project) return res.status(404).json({ error: 'Проект не найден' });
    const tasks = await listProjectTasks(project.slug);
    const stats = (await taskStatsByProject())[project.slug] || { tasks: 0, open: 0, costUsd: 0 };
    return res.json({ ...project, tasks, stats });
  } catch (err) {
    return next(err);
  }
}
