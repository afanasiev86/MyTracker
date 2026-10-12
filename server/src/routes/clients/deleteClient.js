import mongoose from 'mongoose';
import { deleteClientById, projectsOfClientExist } from '../../services/store/index.js';

// DELETE /api/clients/:id — удалить можно только клиента без проектов, чтобы не потерять связи
export async function deleteClient(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Некорректный ID' });
    }
    if (await projectsOfClientExist(req.params.id)) {
      return res.status(409).json({ error: 'Сначала переназначьте или удалите проекты клиента' });
    }
    const result = await deleteClientById(req.params.id);
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Клиент не найден' });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}
