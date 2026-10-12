import { Router } from 'express';
import { listRequests } from './access/listRequests.js';
import { approveRequest } from './access/approveRequest.js';
import { rejectRequest } from './access/rejectRequest.js';

// Маршруты запросов доступа. Каждый обработчик лежит в своём файле папки access/.
const router = Router();

router.get('/', listRequests);
router.post('/:id/approve', approveRequest);
router.post('/:id/reject', rejectRequest);

export default router;
