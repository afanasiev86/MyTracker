import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals';

// Настройки Telegram через HTTP без базы: настоящие маршрут, сервис, шифрование и авторизация.
// Подменены база настроек, перезапуск бота и сеть (fetch к Bot API).
process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_PASSWORD = 'test-password';
delete process.env.TELEGRAM_BOT_TOKEN;
delete process.env.TELEGRAM_OWNER_ID;
delete process.env.TELEGRAM_MINIAPP_URL;

const settings = { findOne: jest.fn(), updateOne: jest.fn(async () => ({})) };
const restartBot = jest.fn();
jest.unstable_mockModule('../src/models/Settings.js', () => ({ default: settings }));
jest.unstable_mockModule('../src/bot/poller/botRunner.js', () => ({ restartBot, registerBotHandlers: jest.fn() }));
jest.unstable_mockModule('../src/services/auth/tokenVersion.js', () => ({
  currentTokenVersion: async () => 1,
  revokeAllTokens: jest.fn(async () => 2),
}));

const request = (await import('supertest')).default;
const { createApp } = await import('../src/app.js');
const { issueToken } = await import('../src/services/auth/tokens.js');
const { encryptSecret, decryptSecret } = await import('../src/services/telegram/secretBox.js');
const { clearTelegramSettings, getTelegramConfig } = await import('../src/services/telegram/runtime.js');

const TOKEN = '123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw';
const calls = [];

function mockTelegram({ getMeOk = true, sendOk = true } = {}) {
  globalThis.fetch = jest.fn(async (url) => {
    calls.push(String(url));
    const method = String(url).split('/').pop();
    const ok = method === 'getMe' ? getMeOk : method === 'sendMessage' ? sendOk : true;
    return { json: async () => (ok ? { ok: true, result: { username: 'my_tracker_bot' } } : { ok: false, description: 'Unauthorized' }) };
  });
}

let owner;
let client;
beforeAll(async () => {
  owner = await issueToken('owner');
  client = await issueToken('client:1', '1h', { role: 'client', clientId: '1' });
});

beforeEach(async () => {
  calls.length = 0;
  restartBot.mockClear();
  settings.updateOne.mockClear();
  settings.findOne.mockReset();
  await clearTelegramSettings();
  settings.updateOne.mockClear();
  mockTelegram();
});

const put = (body, auth = owner) => request(createApp()).put('/api/telegram').set('Authorization', `Bearer ${auth}`).send(body);

describe('шифрование токена', () => {
  it('расшифровывается обратно, а в зашифрованном виде токена нет', () => {
    const packed = encryptSecret(TOKEN);
    expect(packed).not.toContain(TOKEN);
    expect(decryptSecret(packed)).toBe(TOKEN);
  });

  it('повреждённые данные не расшифровываются', () => {
    const [iv, tag, body] = encryptSecret(TOKEN).split('.');
    const flipped = Buffer.from(body, 'base64');
    flipped[0] ^= 1;
    expect(decryptSecret([iv, tag, flipped.toString('base64')].join('.'))).toBeNull();
    expect(decryptSecret('мусор')).toBeNull();
  });
});

describe('/api/telegram', () => {
  it('закрыт для заказчика и для запроса без токена', async () => {
    expect((await request(createApp()).get('/api/telegram')).status).toBe(401);
    const res = await request(createApp()).get('/api/telegram').set('Authorization', `Bearer ${client}`);
    expect(res.status).toBe(403);
  });

  it('до подключения бот не настроен', async () => {
    const res = await request(createApp()).get('/api/telegram').set('Authorization', `Bearer ${owner}`);
    expect(res.body).toMatchObject({ connected: false, hasToken: false, source: 'none' });
  });

  it('сохраняет настройки зашифрованно, запускает бота и не возвращает токен', async () => {
    const res = await put({ botToken: TOKEN, ownerId: '42', miniAppUrl: 'https://tracker.example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      connected: true, ownerId: '42', botUsername: 'my_tracker_bot', source: 'ui', ownerReachable: true,
    });
    expect(JSON.stringify(res.body)).not.toContain(TOKEN);

    const saved = settings.updateOne.mock.calls[0][1].$set;
    expect(saved.telegramTokenEnc).not.toContain(TOKEN);
    expect(decryptSecret(saved.telegramTokenEnc)).toBe(TOKEN);
    expect(getTelegramConfig()).toMatchObject({ botToken: TOKEN, ownerId: '42' });
    expect(restartBot).toHaveBeenCalledTimes(1);
  });

  it('пустой токен оставляет действующий и не перезапускает опрос', async () => {
    await put({ botToken: TOKEN, ownerId: '42', miniAppUrl: '' });
    restartBot.mockClear();

    const res = await put({ botToken: '', ownerId: '43', miniAppUrl: '' });

    expect(res.status).toBe(200);
    expect(getTelegramConfig()).toMatchObject({ botToken: TOKEN, ownerId: '43' });
    expect(restartBot).not.toHaveBeenCalled();
  });

  it('первое сохранение без токена отклоняется', async () => {
    const res = await put({ botToken: '', ownerId: '42', miniAppUrl: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Укажите токен/);
    expect(settings.updateOne).not.toHaveBeenCalled();
  });

  it('отклоняет токен неверного вида, нечисловой ID и http-адрес Mini App', async () => {
    expect((await put({ botToken: 'абракадабра', ownerId: '42', miniAppUrl: '' })).status).toBe(400);
    expect((await put({ botToken: TOKEN, ownerId: 'я', miniAppUrl: '' })).status).toBe(400);
    expect((await put({ botToken: TOKEN, ownerId: '42', miniAppUrl: 'http://example.com' })).status).toBe(400);
    expect(settings.updateOne).not.toHaveBeenCalled();
  });

  it('не сохраняет токен, который Telegram не принял', async () => {
    mockTelegram({ getMeOk: false });
    const res = await put({ botToken: TOKEN, ownerId: '42', miniAppUrl: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Telegram не принял токен/);
    expect(settings.updateOne).not.toHaveBeenCalled();
    expect(restartBot).not.toHaveBeenCalled();
  });

  it('сообщает, если бот не может написать владельцу, но настройки сохраняет', async () => {
    mockTelegram({ sendOk: false });
    const res = await put({ botToken: TOKEN, ownerId: '42', miniAppUrl: '' });
    expect(res.status).toBe(200);
    expect(res.body.ownerReachable).toBe(false);
    expect(res.body.connected).toBe(true);
  });

  it('отключение убирает настройки и перезапускает бота', async () => {
    await put({ botToken: TOKEN, ownerId: '42', miniAppUrl: '' });
    restartBot.mockClear();

    const res = await request(createApp()).delete('/api/telegram').set('Authorization', `Bearer ${owner}`);

    expect(res.body).toMatchObject({ connected: false, source: 'none' });
    expect(getTelegramConfig().botToken).toBeFalsy();
    expect(restartBot).toHaveBeenCalledTimes(1);
  });
});
