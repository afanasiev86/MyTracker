import Project from '../../models/Project.js';
import { taskStats } from './helpers.js';

// GET /api/projects — проекты со статистикой задач
export async function listProjects(_req, res, next) {
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
}
