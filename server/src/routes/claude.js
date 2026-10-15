import { Router } from 'express';
import { getClaude } from './claude/getClaude.js';
import { connectClaude } from './claude/connectClaude.js';
import { disconnectClaude } from './claude/disconnectClaude.js';
import { startClaudeLogin } from './claude/startClaudeLogin.js';
import { finishClaudeLogin } from './claude/finishClaudeLogin.js';
import { cancelClaudeLogin } from './claude/cancelClaudeLogin.js';

// Маршруты аккаунта Claude: смена ключа/токена, которым воркер запускает задачи, из «Настроек»
const router = Router();

router.get('/', getClaude);
router.put('/', connectClaude);
router.delete('/', disconnectClaude);
// Вход в подписку: ссылка, затем код со страницы входа
router.post('/login', startClaudeLogin);
router.post('/login/code', finishClaudeLogin);
router.delete('/login', cancelClaudeLogin);

export default router;
