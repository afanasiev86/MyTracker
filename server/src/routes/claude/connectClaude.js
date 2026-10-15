import { z } from 'zod';
import { connectClaude as connect } from '../../services/claude/index.js';

// Токен не проверяется у Anthropic (нет общего «whoami»), только по форме: не пустой, без пробелов и переносов.
const schema = z.object({
  token: z.string().trim().regex(/^\S{20,512}$/, 'Токен должен быть одной строкой без пробелов, скопируйте его целиком'),
  type: z.enum(['api_key', 'oauth_token']),
  label: z.string().trim().min(1, 'Укажите метку аккаунта').max(100),
});

// PUT /api/claude — сохранить ключ или токен Claude, которым воркер будет запускать задачи
export async function connectClaude(req, res, next) {
  try {
    res.json(await connect(schema.parse(req.body)));
  } catch (err) {
    next(err);
  }
}
