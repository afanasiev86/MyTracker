import { Router } from 'express';
import { listProjects } from './projects/listProjects.js';
import { getProject } from './projects/getProject.js';
import { createProject } from './projects/createProject.js';
import { patchProject } from './projects/patchProject.js';
import { deleteProject } from './projects/deleteProject.js';
import { syncProject } from './projects/syncProject.js';

// Маршруты проектов. Каждый обработчик лежит в своём файле папки projects/.
const router = Router();

router.get('/', listProjects);
router.get('/:id', getProject);
router.post('/', createProject);
router.patch('/:id', patchProject);
router.post('/:id/sync-github', syncProject);
router.delete('/:id', deleteProject);

export default router;
