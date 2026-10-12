import { Router } from 'express';
import { portalGuard } from './portal/guard.js';
import { me } from './portal/me.js';
import { listTasks } from './portal/listTasks.js';
import { addComment } from './portal/addComment.js';

// Маршруты портала заказчика. Каждый обработчик лежит в своём файле папки portal/.
const router = Router();

router.use(portalGuard);
router.get('/me', me);
router.get('/tasks', listTasks);
router.post('/tasks/:id/comments', addComment);

export default router;
