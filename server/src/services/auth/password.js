import { timingSafeEqual } from 'node:crypto';
import { getConfig } from '../../config.js';

// Сравнение за постоянное время, чтобы не утекала информация о пароле
export function checkPassword(input) {
  const expected = getConfig().adminPassword || '';
  if (!expected) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
