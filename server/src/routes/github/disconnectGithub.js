import { disconnectGithub as disconnect } from '../../services/github/index.js';

// DELETE /api/github — убрать токен, заданный в интерфейсе
export async function disconnectGithub(_req, res, next) {
  try {
    res.json(await disconnect());
  } catch (err) {
    next(err);
  }
}
