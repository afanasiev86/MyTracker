import { Router } from 'express';
import { z } from 'zod';
import { checkPassword, issueToken } from '../services/auth.js';

const router = Router();

const loginSchema = z.object({ password: z.string().min(1) });

router.post('/login', (req, res, next) => {
  try {
    const { password } = loginSchema.parse(req.body);
    if (!checkPassword(password)) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }
    return res.json({ token: issueToken('owner') });
  } catch (err) {
    return next(err);
  }
});

export default router;
