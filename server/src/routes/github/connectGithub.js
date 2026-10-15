import { z } from 'zod';
import { connectGithub as connect } from '../../services/github/index.js';

// Токены GitHub: github_pat_… (fine-grained), ghp_… (classic). Допускаем только символы токена, без пробелов и переносов.
const schema = z.object({
  token: z.string().trim().regex(/^[A-Za-z0-9_]{20,255}$/, 'Токен выглядит как github_pat_… Скопируйте его с GitHub целиком'),
});

// PUT /api/github — проверить токен у GitHub и сохранить его зашифрованным
export async function connectGithub(req, res, next) {
  try {
    res.json(await connect(schema.parse(req.body).token));
  } catch (err) {
    next(err);
  }
}
