import { z } from 'zod';
import { completeLogin } from '../../services/claude/login/index.js';

const schema = z.object({
  code: z.string().trim().min(1, 'Вставьте код со страницы входа').max(2000),
  label: z.string().trim().min(1, 'Укажите метку аккаунта').max(100),
});

// POST /api/claude/login/code — завершить вход кодом со страницы входа, токен сохраняется на сервере и наружу не отдаётся
export async function finishClaudeLogin(req, res, next) {
  try {
    res.json(await completeLogin(schema.parse(req.body)));
  } catch (err) {
    next(err);
  }
}
