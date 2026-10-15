import crypto from 'node:crypto';
import { getConfig } from '../../config.js';
import { currentTokenVersion } from '../auth/tokenVersion.js';

export const GATE_COOKIE = 'uat_gate';
export const GATE_MAX_AGE_S = 30 * 24 * 60 * 60;

// Пропуск на стенд — не JWT: его нельзя использовать как токен владельца в API трекера, а приложение стенда,
// которое видит cookie в запросах, не получает ничего, кроме права открыть этот же стенд (хост входит в подпись).
// Версия токенов тоже в подписи, поэтому «Завершить все сессии» закрывает и стенды.
const signature = (host, exp, tv) => {
  const key = crypto.createHmac('sha256', getConfig().jwtSecret).update('uat-gate').digest();
  return crypto.createHmac('sha256', key).update(`${host}|${exp}|${tv}`).digest('hex');
};

export async function issueGateValue(host, now = Date.now()) {
  const exp = Math.floor(now / 1000) + GATE_MAX_AGE_S;
  const tv = await currentTokenVersion();
  return `${exp}.${tv}.${signature(host, exp, tv)}`;
}

function cookieValue(header, name) {
  for (const part of String(header || '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return '';
}

// Верен ли пропуск из заголовка Cookie для этого хоста: подпись, срок и версия токенов
export async function checkGateCookie(cookieHeader, host, now = Date.now()) {
  const [exp, tv, sig, extra] = cookieValue(cookieHeader, GATE_COOKIE).split('.');
  if (!exp || !tv || !sig || extra !== undefined) return false;
  if (!Number.isInteger(Number(exp)) || Number(exp) * 1000 < now) return false;
  if (String(await currentTokenVersion()) !== tv) return false;
  const expected = Buffer.from(signature(host, exp, tv));
  const given = Buffer.from(sig);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

export const gateCookieHeader = (value) => `${GATE_COOKIE}=${value}; Path=/; Max-Age=${GATE_MAX_AGE_S}; HttpOnly; Secure; SameSite=Lax`;
