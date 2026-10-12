import { findTask } from '../../services/store/tasks.js';
import { answerTask } from '../../services/runs.js';
import { textSchema } from './schemas.js';

// POST /api/tasks/:id/answer — ответ владельца на вопрос Claude, продолжает ту же сессию
export async function answerRoute(req, res, next) {
  try {
    const { text } = textSchema.parse(req.body);
    const task = await findTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    const result = await answerTask(task, text);
    if (result.error) return res.status(409).json({ error: result.error });
    return res.status(202).json(result.task.toObject());
  } catch (err) {
    return next(err);
  }
}
