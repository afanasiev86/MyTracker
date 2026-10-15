import { startLogin } from '../../services/claude/login/index.js';

// POST /api/claude/login — начать вход в подписку Claude, в ответе ссылка для браузера
export async function startClaudeLogin(_req, res, next) {
  try {
    res.json(await startLogin());
  } catch (err) {
    next(err);
  }
}
