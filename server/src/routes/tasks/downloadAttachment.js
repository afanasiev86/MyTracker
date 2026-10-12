import Task from '../../models/Task.js';
import { attachmentStream } from '../../services/attachments.js';

// GET /api/tasks/:id/attachments/:attachmentId — файл из хранилища проходит через API (бакет приватный)
export async function downloadAttachment(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    const file = await attachmentStream(task, req.params.attachmentId);
    if (!file) return res.status(404).json({ error: 'Вложение не найдено' });
    res.type(file.mime);
    file.stream.on('error', next);
    return file.stream.pipe(res);
  } catch (err) {
    return next(err);
  }
}
