import jwt from 'jsonwebtoken';
import { currentTokenVersion } from './tokenVersion.js';
import { getConfig } from '../../config.js';

// claims — дополнительные поля токена, например { role: 'client', clientId }
export async function issueToken(sub, expiresIn = '30d', claims = {}) {
  const tv = await currentTokenVersion();
  return jwt.sign({ sub, tv, ...claims }, getConfig().jwtSecret, { expiresIn });
}

// Проверка токена: подпись, срок и версия (отзыв)
export async function verifyToken(token) {
  const payload = jwt.verify(token, getConfig().jwtSecret);
  if (payload.tv !== await currentTokenVersion()) {
    throw new Error('token revoked');
  }
  return payload;
}
