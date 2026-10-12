import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { checkPassword } from '../services/auth.js';

const router = Router();

const loginSchema = z.object({ password: z.string().min(1) });

router.post('/login', (req, res, next) => {
  try {
    const { password } = loginSchema.parse(req.body);
    if (!checkPassword(password)) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }
    const token = jwt.sign({ sub: 'owner' }, process.env.JWT_SECRET, { expiresIn: '30d' });
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

export default router;
