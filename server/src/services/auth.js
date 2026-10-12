import { timingSafeEqual } from 'node:crypto';

// Сравнение за постоянное время, чтобы не утекала информация о пароле
export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
