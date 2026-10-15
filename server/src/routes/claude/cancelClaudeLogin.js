import { cancelLogin } from '../../services/claude/login/index.js';

// DELETE /api/claude/login — отменить начатый вход
export async function cancelClaudeLogin(_req, res, next) {
  try {
    await cancelLogin();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
