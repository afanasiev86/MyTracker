import { Router } from 'express';
import { listTasks } from './tasks/listTasks.js';
import { createTask } from './tasks/createTask.js';
import { getTask } from './tasks/getTask.js';
import { patchTask } from './tasks/patchTask.js';
import { addComment } from './tasks/addComment.js';
import { runTaskRoute } from './tasks/runTaskRoute.js';
import { questionRoute } from './tasks/questionRoute.js';
import { answerRoute } from './tasks/answerRoute.js';
import { cancelRoute } from './tasks/cancelRoute.js';
import { diffRoute } from './tasks/diffRoute.js';
import { attachmentBody, uploadAttachment } from './tasks/uploadAttachment.js';
import { downloadAttachment } from './tasks/downloadAttachment.js';

// Маршруты задач. Каждый обработчик лежит в своём файле папки tasks/.
const router = Router();

router.get('/', listTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.patch('/:id', patchTask);
router.post('/:id/comments', addComment);
router.post('/:id/run', runTaskRoute);
router.post('/:id/question', questionRoute);
router.post('/:id/answer', answerRoute);
router.post('/:id/cancel', cancelRoute);
router.get('/:id/diff', diffRoute);
router.post('/:id/attachments', attachmentBody, uploadAttachment);
router.get('/:id/attachments/:attachmentId', downloadAttachment);

export default router;
