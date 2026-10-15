import mongoose from 'mongoose';
import { findProject } from '../../services/store/index.js';
import { startStand as start } from '../../services/uat/startStand.js';
import { domainError } from '../../services/errors.js';

// POST /api/projects/:id/uat — собрать и запустить UAT-стенд проекта. Сборка идёт в фоне: ответ 202.
export async function startStand(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw domainError('invalid', 'Некорректный ID');
    const project = await findProject(req.params.id);
    if (!project) throw domainError('not_found', 'Проект не найден');
    await start(project.slug);
    return res.status(202).json({ queued: true });
  } catch (err) {
    return next(err);
  }
}
