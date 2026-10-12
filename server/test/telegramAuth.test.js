import { createHmac } from 'node:crypto';
import { verifyInitData } from '../src/services/telegramAuth.js';

const BOT_TOKEN = '123456:TEST_TOKEN';
const NOW = 1_800_000_000;

// Собирает initData так же, как это делает Telegram
function signInitData(fields, token = BOT_TOKEN) {
  const params = new URLSearchParams(fields);
  const dcs = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(token).digest();
  const hash = createHmac('sha256', secret).update(dcs).digest('hex');
  params.set('hash', hash);
  return params.toString();
}

const user = JSON.stringify({ id: 42, first_name: 'Test' });

describe('verifyInitData', () => {
  it('принимает корректно подписанные данные и возвращает пользователя', () => {
    const initData = signInitData({ auth_date: String(NOW - 60), user, query_id: 'AAH' });
    const result = verifyInitData(initData, BOT_TOKEN, NOW);
    expect(result.ok).toBe(true);
    expect(result.user.id).toBe(42);
  });

  it('отклоняет данные, подписанные другим токеном', () => {
    const initData = signInitData({ auth_date: String(NOW - 60), user }, 'other:token');
    expect(verifyInitData(initData, BOT_TOKEN, NOW).ok).toBe(false);
  });

  it('отклоняет подмену пользователя после подписи', () => {
    const signed = signInitData({ auth_date: String(NOW - 60), user });
    const params = new URLSearchParams(signed);
    params.set('user', JSON.stringify({ id: 7, first_name: 'Attacker' }));
    expect(verifyInitData(params.toString(), BOT_TOKEN, NOW).ok).toBe(false);
  });

  it('отклоняет устаревшие данные', () => {
    const initData = signInitData({ auth_date: String(NOW - 2 * 24 * 3600), user });
    const result = verifyInitData(initData, BOT_TOKEN, NOW);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/устарели/);
  });

  it('отклоняет запрос без подписи и пустые данные', () => {
    expect(verifyInitData('auth_date=1&user=x', BOT_TOKEN, NOW).ok).toBe(false);
    expect(verifyInitData('', BOT_TOKEN, NOW).ok).toBe(false);
    expect(verifyInitData('hash=zz', BOT_TOKEN, NOW).ok).toBe(false);
  });
});

describe('verifyInitData: некорректный пользователь', () => {
  it('отклоняет подписанные данные с битым JSON в user', () => {
    const initData = signInitData({ auth_date: String(NOW - 60), user: '{не json' });
    const result = verifyInitData(initData, BOT_TOKEN, NOW);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('некорректные данные пользователя');
  });
});
