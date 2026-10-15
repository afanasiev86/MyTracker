import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals';

// Настройки аккаунта Claude через HTTP без базы: настоящие маршрут, сервис, шифрование и авторизация.
// В отличие от GitHub, сеть не подменяется: у Anthropic нет общего «whoami», токен не проверяется запросом.
process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_PASSWORD = 'test-password';

const settings = { findOne: jest.fn(), updateOne: jest.fn(async () => ({})) };
jest.unstable_mockModule('../src/models/Settings.js', () => ({ default: settings }));
jest.unstable_mockModule('../src/services/auth/tokenVersion.js', () => ({
  currentTokenVersion: async () => 1,
  revokeAllTokens: jest.fn(async () => 2),
}));

const request = (await import('supertest')).default;
const { createApp } = await import('../src/app.js');
const { issueToken } = await import('../src/services/auth/tokens.js');
const { encryptSecret } = await import('../src/services/telegram/secretBox.js');
const { clearClaudeSettings, getClaudeCredential, loadClaudeSettings } = await import('../src/services/claude/settings.js');

const TOKEN = 'sk-ant-api03-0123456789abcdefghijklmnopqrstuvwxyz';

let owner;
let client;
let app;
beforeAll(async () => {
  app = createApp();
  owner = await issueToken('owner');
  client = await issueToken('client:1', '1h', { role: 'client', clientId: '1' });
});

beforeEach(async () => {
  settings.updateOne.mockClear();
  settings.findOne.mockReset();
  await clearClaudeSettings();
  settings.updateOne.mockClear();
});

const get = () => request(app).get('/api/claude').set('Authorization', `Bearer ${owner}`);
const put = (body) => request(app).put('/api/claude').set('Authorization', `Bearer ${owner}`).send(body);
const del = () => request(app).delete('/api/claude').set('Authorization', `Bearer ${owner}`);

describe('настройки аккаунта Claude', () => {
  it('до подключения аккаунта нет', async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ connected: false, label: '', type: '' });
  });

  it('требует вход владельца: без токена 401, заказчику 403', async () => {
    expect((await request(app).get('/api/claude')).status).toBe(401);
    expect((await request(app).put('/api/claude').set('Authorization', `Bearer ${client}`).send({ token: TOKEN, type: 'api_key', label: 'Личный' })).status).toBe(403);
  });

  it('сохраняет ключ зашифрованным и не отдаёт его наружу', async () => {
    const res = await put({ token: TOKEN, type: 'api_key', label: 'Личный' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ connected: true, label: 'Личный', type: 'api_key' });
    expect(JSON.stringify(res.body)).not.toContain(TOKEN);

    const stored = settings.updateOne.mock.calls[0][1].$set;
    expect(stored.claudeTokenEnc).not.toContain(TOKEN);
    expect(stored.claudeTokenType).toBe('api_key');
    expect(stored.claudeAccountLabel).toBe('Личный');
    expect(getClaudeCredential()).toEqual({ token: TOKEN, type: 'api_key' });
    expect(JSON.stringify((await get()).body)).not.toContain(TOKEN);
  });

  it('принимает долгоживущий OAuth-токен (claude setup-token) с типом oauth_token', async () => {
    const res = await put({ token: TOKEN, type: 'oauth_token', label: 'Второй аккаунт' });
    expect(res.body).toEqual({ connected: true, label: 'Второй аккаунт', type: 'oauth_token' });
    expect(getClaudeCredential()).toEqual({ token: TOKEN, type: 'oauth_token' });
  });

  it.each([
    [{ token: '', type: 'api_key', label: 'x' }],
    [{ token: 'с пробелами внутри строки', type: 'api_key', label: 'x' }],
    [{ token: TOKEN, type: 'не_такой_тип', label: 'x' }],
    [{ token: TOKEN, type: 'api_key', label: '' }],
  ])('отклоняет неверные данные %j без сохранения', async (body) => {
    const res = await put(body);
    expect(res.status).toBe(400);
    expect(settings.updateOne).not.toHaveBeenCalled();
  });

  it('отключение убирает аккаунт, воркер возвращается к аккаунту сервера', async () => {
    await put({ token: TOKEN, type: 'api_key', label: 'Личный' });

    const res = await del();
    expect(res.body).toEqual({ connected: false, label: '', type: '' });
    expect(getClaudeCredential()).toBeNull();
  });

  it('при запуске подхватывает сохранённый аккаунт из базы', async () => {
    settings.findOne.mockReturnValue({
      lean: async () => ({ claudeTokenEnc: encryptSecret(TOKEN), claudeTokenType: 'api_key', claudeAccountLabel: 'Личный' }),
    });
    await loadClaudeSettings();
    expect(getClaudeCredential()).toEqual({ token: TOKEN, type: 'api_key' });
    expect((await get()).body).toEqual({ connected: true, label: 'Личный', type: 'api_key' });
  });

  it('если токен не расшифровался (сменился JWT_SECRET), считает Claude не подключённым', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    settings.findOne.mockReturnValue({ lean: async () => ({ claudeTokenEnc: 'мусор', claudeTokenType: 'api_key', claudeAccountLabel: 'x' }) });
    await loadClaudeSettings();
    expect(getClaudeCredential()).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
