import { checkPassword, issueToken } from '../../services/auth.js';
import { loginSchema } from './schemas.js';

// POST /api/auth/login — вход владельца по паролю
export async function login(req, res, next) {
  try {
    const { password } = loginSchema.parse(req.body);
    if (!checkPassword(password)) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }
    return res.json({ token: await issueToken('owner'), role: 'owner' });
  } catch (err) {
    return next(err);
  }
}
