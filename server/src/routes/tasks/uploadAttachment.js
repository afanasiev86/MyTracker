import express from 'express';
import { findTask } from '../../services/store/tasks.js';
import { ALLOWED_TYPES, MAX_ATTACHMENT_BYTES } from '../../services/attachments/config.js';
import { saveAttachment } from '../../services/attachments/saveAttachment.js';

// Тело запроса читается как сырой файл: разрешённые типы и предел размера задают middleware
export const attachmentBody = express.raw({ type: Object.keys(ALLOWED_TYPES), limit: MAX_ATTACHMENT_BYTES });

// POST /api/tasks/:id/attachments — тип файла в Content-Type, имя в X-File-Name
export async function uploadAttachment(req, res, next) {
  try {
    const task = await findTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    if (!Buffer.isBuffer(req.body)) return res.status(415).json({ error: 'Можно прикреплять только картинки' });
    const name = req.get('X-File-Name') ? decodeURIComponent(req.get('X-File-Name')) : '';
    const attachment = await saveAttachment(task, req.body, req.get('Content-Type'), name);
    return res.status(201).json(attachment.toObject());
  } catch (err) {
    return next(err);
  }
}
