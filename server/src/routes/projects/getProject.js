import mongoose from 'mongoose';
import Project from '../../models/Project.js';
import Task from '../../models/Task.js';
import { taskStats } from './helpers.js';

// GET /api/projects/:id — проект с задачами и статистикой
export async function getProject(req, res, next) {
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
}
