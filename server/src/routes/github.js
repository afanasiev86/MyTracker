import { Router } from 'express';
import { listGithubRepos } from './github/listRepos.js';

// Маршруты GitHub: список репозиториев для формы проекта
const router = Router();

router.get('/repos', listGithubRepos);

export default router;
