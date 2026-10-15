import mongoose from 'mongoose';
import { findProject } from '../../services/store/index.js';
import { readStandEnv } from '../../services/uat/readStandEnv.js';
import { domainError } from '../../services/errors.js';

// GET /api/projects/:id/uat/env — переменные стенда (.env) с паролями. Только владелец: токен воркера, которым
// работает Claude, сюда не пускается, иначе он мог бы прочитать пароли стендов через скрипт трекера.
export async function standEnv(req, res, next) {
  try {
    if (req.user?.sub !== 'owner') return res.status(403).json({ error: 'Переменные стенда видит только владелец' });
    if (!mongoose.isValidObjectId(req.params.id)) throw domainError('invalid', 'Некорректный ID');
    const project = await findProject(req.params.id);
    if (!project) throw domainError('not_found', 'Проект не найден');
    return res.json(await readStandEnv(project.slug));
  } catch (err) {
    return next(err);
  }
}
