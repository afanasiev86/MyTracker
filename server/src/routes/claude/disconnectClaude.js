import { disconnectClaude as disconnect } from '../../services/claude/index.js';

// DELETE /api/claude — убрать аккаунт, заданный в интерфейсе, воркер возвращается к аккаунту сервера
export async function disconnectClaude(_req, res, next) {
  try {
    res.json(await disconnect());
  } catch (err) {
    next(err);
  }
}
