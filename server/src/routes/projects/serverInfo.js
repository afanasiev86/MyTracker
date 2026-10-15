import mongoose from 'mongoose';
import { findProject } from '../../services/store/index.js';
import { projectServerInfo } from '../../services/projects/serverInfo.js';
import { domainError } from '../../services/errors.js';

// GET /api/projects/:id/server — локальная копия проекта на сервере и состояние UAT-стенда
export async function serverInfo(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw domainError('invalid', 'Некорректный ID');
    const project = await findProject(req.params.id);
    if (!project) throw domainError('not_found', 'Проект не найден');
    return res.json(await projectServerInfo(project.toObject()));
  } catch (err) {
    return next(err);
  }
}
