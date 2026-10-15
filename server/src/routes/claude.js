import { Router } from 'express';
import { getClaude } from './claude/getClaude.js';
import { connectClaude } from './claude/connectClaude.js';
import { disconnectClaude } from './claude/disconnectClaude.js';

// Маршруты аккаунта Claude: смена ключа/токена, которым воркер запускает задачи, из «Настроек»
const router = Router();

router.get('/', getClaude);
router.put('/', connectClaude);
router.delete('/', disconnectClaude);

export default router;
