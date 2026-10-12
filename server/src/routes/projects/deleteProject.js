import mongoose from 'mongoose';
import { deleteProject as removeProject } from '../../services/store/index.js';

// DELETE /api/projects/:id — удалить можно только пустой проект
export async function deleteProject(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Некорректный ID' });
    }
    const result = await removeProject(req.params.id);
    if (result.notFound) return res.status(404).json({ error: 'Проект не найден' });
    if (result.conflict) return res.status(409).json({ error: result.conflict });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}
