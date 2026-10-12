import { Router } from 'express';
import { z } from 'zod';
import Client from '../models/Client.js';
import { clientTasks, addClientComment } from '../services/portal.js';
import { isPortalOpen } from '../services/access.js';

const router = Router();

// Доступ мог быть закрыт уже после входа: проверяем на каждом запросе
router.use(async (req, res, next) => {
  try {
    if (!(await isPortalOpen(req.user.clientId))) {
      return res.status(403).json({ error: 'Доступ к порталу закрыт' });
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

const commentSchema = z.object({
  text: z.string().trim().min(1, 'Напишите текст комментария').max(2000, 'Комментарий слишком длинный'),
});

// Имя заказчика для шапки портала
router.get('/me', async (req, res, next) => {
  try {
    const client = await Client.findById(req.user.clientId).select('name').lean();
    if (!client) return res.status(404).json({ error: 'Профиль не найден' });
    return res.json({ name: client.name });
  } catch (err) {
    return next(err);
  }
});

router.get('/tasks', async (req, res, next) => {
  try {
    return res.json(await clientTasks(req.user.clientId));
  } catch (err) {
    return next(err);
  }
});

router.post('/tasks/:id/comments', async (req, res, next) => {
  try {
    const { text } = commentSchema.parse(req.body);
    const result = await addClientComment(req.user.clientId, req.params.id, text);
    if (result.notFound) return res.status(404).json({ error: 'Задача не найдена' });
    return res.status(201).json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

export default router;
