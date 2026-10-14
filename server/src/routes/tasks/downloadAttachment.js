import { findTask } from '../../services/store/tasks.js';
import { attachmentStream } from '../../services/attachments/attachmentStream.js';

// GET /api/tasks/:id/attachments/:attachmentId — файл отдаётся через API, прямой ссылки на папку нет
export async function downloadAttachment(req, res, next) {
  try {
    const task = await findTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    const file = attachmentStream(task, req.params.attachmentId);
    if (!file) return res.status(404).json({ error: 'Вложение не найдено' });
    res.type(file.mime);
    file.stream.on('error', next);
    return file.stream.pipe(res);
  } catch (err) {
    return next(err);
  }
}
