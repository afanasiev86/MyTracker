import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { getConfig } from '../../config.js';

// Токен бота лежит в базе зашифрованным, чтобы он не попадал открытым текстом в бэкапы Mongo.
// Ключ берётся из JWT_SECRET: при его смене сохранённый токен не расшифруется, его придётся ввести заново.
const key = () => createHash('sha256').update(String(getConfig().jwtSecret)).digest();

export function encryptSecret(plain) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((b) => b.toString('base64')).join('.');
}

// Возвращает расшифрованную строку или null, если данные повреждены или ключ другой
export function decryptSecret(packed) {
  try {
    const [iv, tag, body] = packed.split('.').map((p) => Buffer.from(p, 'base64'));
    const decipher = createDecipheriv('aes-256-gcm', key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
