import { timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import Settings from '../models/Settings.js';

// Сравнение за постоянное время, чтобы не утекала информация о пароле
export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

let cachedVersion = null;

export async function currentTokenVersion() {
  if (cachedVersion === null) {
    const doc = await Settings.findOneAndUpdate(
      { key: 'auth' },
      { $setOnInsert: { tokenVersion: 1 } },
      { upsert: true, new: true, lean: true },
    );
    cachedVersion = doc.tokenVersion;
  }
  return cachedVersion;
}

// Все выданные токены становятся недействительными
export async function revokeAllTokens() {
  const doc = await Settings.findOneAndUpdate(
    { key: 'auth' },
    { $inc: { tokenVersion: 1 } },
    { upsert: true, new: true, lean: true },
  );
  cachedVersion = doc.tokenVersion;
}

// claims — дополнительные поля токена, например { role: 'client', clientId }
export async function issueToken(sub, expiresIn = '30d', claims = {}) {
  const tv = await currentTokenVersion();
  return jwt.sign({ sub, tv, ...claims }, process.env.JWT_SECRET, { expiresIn });
}

// Проверка токена: подпись, срок и версия (отзыв)
export async function verifyToken(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (payload.tv !== await currentTokenVersion()) {
    throw new Error('token revoked');
  }
  return payload;
}
