import mongoose from 'mongoose';
import Project from '../../models/Project.js';
import Task from '../../models/Task.js';

// DELETE /api/projects/:id — удалить можно только пустой проект
export async function deleteProject(req, res, next) {
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
}
