import Task from '../../models/Task.js';
import { textSchema } from './schemas.js';

// POST /api/tasks/:id/question — Claude задаёт вопрос во время работы (вызывает skill implement-task).
// Задача перейдёт в «Нужен ответ» после завершения запуска.
export async function questionRoute(req, res, next) {
  try {
    const { text } = textSchema.parse(req.body);
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    if (task.status !== 'in_progress') {
      return res.status(409).json({ error: 'Вопрос можно задать только во время работы' });
    }
    task.pendingQuestion = text;
    await task.save();
    return res.status(201).json({ ok: true });
  } catch (err) {
    return next(err);
  }
}
