import { findTask } from '../../services/store/tasks.js';
import { fixTask } from '../../services/runs/fixTask.js';
import { fixSchema } from './schemas.js';

// POST /api/tasks/:id/fix — попросить Claude исправить упавшую задачу (статус «Ошибка»).
// В теле необязательная подсказка: { text }.
export async function fixRoute(req, res, next) {
  try {
    const { text } = fixSchema.parse(req.body ?? {});
    const task = await findTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    const result = await fixTask(task, text);
    if (result.error) return res.status(409).json({ error: result.error });
    return res.status(202).json(result.task.toObject());
  } catch (err) {
    return next(err);
  }
}
