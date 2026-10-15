import { Router } from 'express';
import { getGithub } from './github/getGithub.js';
import { connectGithub } from './github/connectGithub.js';
import { disconnectGithub } from './github/disconnectGithub.js';
import { listGithubRepos } from './github/listRepos.js';

// Маршруты GitHub: подключение (токен из «Настроек») и список репозиториев для формы проекта
const router = Router();

router.get('/', getGithub);
router.put('/', connectGithub);
router.delete('/', disconnectGithub);
router.get('/repos', listGithubRepos);

export default router;
