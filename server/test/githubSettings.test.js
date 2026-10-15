import { describe, it, expect, jest, beforeAll, beforeEach, afterEach } from '@jest/globals';

// Настройки GitHub через HTTP без базы: настоящие маршрут, сервис, шифрование и авторизация.
// Подменены база настроек и сеть (fetch к GitHub).
process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_PASSWORD = 'test-password';
delete process.env.GITHUB_TOKEN;

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
const { clearGithubSettings, getGithubToken, loadGithubSettings } = await import('../src/services/github/settings.js');

const TOKEN = 'github_pat_11ABCDEFG0abcdefghijkl_mnopqrstuvwxyz0123456789ABCDEFGHIJ';
const realFetch = global.fetch;

function mockGithub(status = 200, body = { login: 'afanasiev86' }) {
  global.fetch = jest.fn(async () => ({ ok: status < 300, status, json: async () => body }));
  return global.fetch;
}

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
  await clearGithubSettings();
  settings.updateOne.mockClear();
});

afterEach(() => {
  global.fetch = realFetch;
  delete process.env.GITHUB_TOKEN;
});

const get = () => request(app).get('/api/github').set('Authorization', `Bearer ${owner}`);
const put = (body) => request(app).put('/api/github').set('Authorization', `Bearer ${owner}`).send(body);

describe('настройки GitHub', () => {
  it('до подключения токена нет', async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ connected: false, login: '', source: 'none' });
  });

  it('требует вход владельца: без токена 401, заказчику 403', async () => {
    expect((await request(app).get('/api/github')).status).toBe(401);
    expect((await request(app).put('/api/github').set('Authorization', `Bearer ${client}`).send({ token: TOKEN })).status).toBe(403);
  });

  it('проверяет токен у GitHub, сохраняет зашифрованным и не отдаёт его наружу', async () => {
    const fetchSpy = mockGithub();
    const res = await put({ token: TOKEN });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ connected: true, login: 'afanasiev86', source: 'ui' });
    expect(JSON.stringify(res.body)).not.toContain(TOKEN);
    expect(fetchSpy.mock.calls[0][0]).toBe('https://api.github.com/user');
    expect(fetchSpy.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${TOKEN}`);

    const stored = settings.updateOne.mock.calls[0][1].$set;
    expect(stored.githubTokenEnc).not.toContain(TOKEN);
    expect(stored.githubLogin).toBe('afanasiev86');
    expect(getGithubToken()).toBe(TOKEN);
    expect(JSON.stringify((await get()).body)).not.toContain(TOKEN);
  });

  it('отвергнутый GitHub токен не сохраняется', async () => {
    mockGithub(401, { message: 'Bad credentials' });
    const res = await put({ token: TOKEN });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/GitHub не принял токен/);
    expect(settings.updateOne).not.toHaveBeenCalled();
    expect(getGithubToken()).toBe('');
  });

  it.each(['', 'короткий', 'ghp_with spaces in the middle of it', `${TOKEN}\n`.repeat(2)])(
    'отклоняет токен неверного вида %j без обращения к GitHub',
    async (token) => {
      const fetchSpy = mockGithub();
      const res = await put({ token });
      expect(res.status).toBe(400);
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it('токен из окружения работает, а токен из интерфейса важнее него', async () => {
    process.env.GITHUB_TOKEN = 'env-token-0123456789abcdef';
    expect((await get()).body).toEqual({ connected: true, login: '', source: 'env' });
    expect(getGithubToken()).toBe('env-token-0123456789abcdef');

    mockGithub();
    await put({ token: TOKEN });
    expect(getGithubToken()).toBe(TOKEN);
    expect((await get()).body.source).toBe('ui');
  });

  it('отключение убирает токен из интерфейса, окружение остаётся запасным', async () => {
    mockGithub();
    await put({ token: TOKEN });
    process.env.GITHUB_TOKEN = 'env-token-0123456789abcdef';

    const res = await request(app).delete('/api/github').set('Authorization', `Bearer ${owner}`);
    expect(res.body).toEqual({ connected: true, login: '', source: 'env' });
    expect(getGithubToken()).toBe('env-token-0123456789abcdef');
  });

  it('при запуске подхватывает сохранённый токен из базы', async () => {
    settings.findOne.mockReturnValue({ lean: async () => ({ githubTokenEnc: encryptSecret(TOKEN), githubLogin: 'afanasiev86' }) });
    await loadGithubSettings();
    expect(getGithubToken()).toBe(TOKEN);
    expect((await get()).body).toEqual({ connected: true, login: 'afanasiev86', source: 'ui' });
  });

  it('если токен не расшифровался (сменился JWT_SECRET), считает GitHub не подключённым', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    settings.findOne.mockReturnValue({ lean: async () => ({ githubTokenEnc: 'мусор', githubLogin: 'x' }) });
    await loadGithubSettings();
    expect(getGithubToken()).toBe('');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('список репозиториев без токена пустой и помечен как выключенный', async () => {
    const res = await request(app).get('/api/github/repos').set('Authorization', `Bearer ${owner}`);
    expect(res.body).toEqual({ enabled: false, repos: [] });
  });
});
