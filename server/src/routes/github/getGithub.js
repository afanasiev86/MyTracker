import { describeGithub } from '../../services/github/index.js';

// GET /api/github — состояние подключения GitHub. Токен наружу не отдаётся.
export function getGithub(_req, res) {
  res.json(describeGithub());
}
