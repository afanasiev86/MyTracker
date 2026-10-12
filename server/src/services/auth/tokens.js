import jwt from 'jsonwebtoken';
import { currentTokenVersion } from './tokenVersion.js';

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
