import { createHmac, timingSafeEqual } from 'node:crypto';

// Проверка подписи initData от Telegram Mini App
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
const MAX_AGE_SEC = 24 * 60 * 60;

export function verifyInitData(initData, botToken, nowSec = Math.floor(Date.now() / 1000)) {
  if (!initData || !botToken) return { ok: false, reason: 'нет данных' };

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false, reason: 'нет подписи' };
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = createHmac('sha256', secretKey).update(dataCheckString).digest();
  const received = Buffer.from(hash, 'hex');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return { ok: false, reason: 'неверная подпись' };
  }

  const authDate = Number(params.get('auth_date'));
  if (!authDate || nowSec - authDate > MAX_AGE_SEC) {
    return { ok: false, reason: 'данные устарели, откройте приложение заново' };
  }

  try {
    const user = params.get('user') ? JSON.parse(params.get('user')) : null;
    return { ok: true, user };
  } catch {
    return { ok: false, reason: 'некорректные данные пользователя' };
  }
}
