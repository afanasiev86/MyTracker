import { askQuestion } from '../../services/tasks/askQuestion.js';
import { textSchema } from './schemas.js';

// POST /api/tasks/:id/question — Claude задаёт вопрос во время работы (вызывает skill implement-task).
export async function questionRoute(req, res, next) {
  try {
    const { text } = textSchema.parse(req.body);
    await askQuestion(req.params.id, text);
    return res.status(201).json({ ok: true });
  } catch (err) {
    return next(err);
  }
}
