import { Router } from 'express';
import { listClients } from './clients/listClients.js';
import { createClient } from './clients/createClient.js';
import { patchClient } from './clients/patchClient.js';
import { deleteClient } from './clients/deleteClient.js';
import { revokePortalRoute } from './clients/revokePortalRoute.js';

// Маршруты клиентов. Каждый обработчик лежит в своём файле папки clients/.
const router = Router();

router.get('/', listClients);
router.post('/', createClient);
router.patch('/:id', patchClient);
router.delete('/:id', deleteClient);
router.post('/:id/portal/revoke', revokePortalRoute);

export default router;
