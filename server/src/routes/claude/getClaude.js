import { describeClaude } from '../../services/claude/index.js';

// GET /api/claude — состояние подключения аккаунта Claude. Токен наружу не отдаётся.
export function getClaude(_req, res) {
  res.json(describeClaude());
}
