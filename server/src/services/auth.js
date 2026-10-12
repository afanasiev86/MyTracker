import { timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';

// Сравнение за постоянное время, чтобы не утекала информация о пароле
export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function issueToken(sub, expiresIn = '30d') {
  return jwt.sign({ sub }, process.env.JWT_SECRET, { expiresIn });
}
