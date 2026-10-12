import mongoose from 'mongoose';
import { deleteProject as removeProject } from '../../services/store/index.js';

// DELETE /api/projects/:id — удалить можно только пустой проект
export async function deleteProject(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Некорректный ID' });
    }
    await removeProject(req.params.id);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}
