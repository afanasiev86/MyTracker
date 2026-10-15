import express from 'express';
import request from 'supertest';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Вход на стенды: пропуск в cookie, проверка пароля владельца, привязка к хосту и версии токенов. База подменена.
process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_PASSWORD = 'owner-password';
process.env.UAT_DOMAIN = 'example.com';
let version = 1;
jest.unstable_mockModule('../src/services/auth/tokenVersion.js', () => ({
  currentTokenVersion: async () => version,
  revokeAllTokens: async () => version,
}));

const { default: gate } = await import('../src/routes/uatGate.js');
const { issueGateValue, checkGateCookie } = await import('../src/services/uat/gateCookie.js');

const app = () => {
  const server = express();
  server.set('trust proxy', 1);
  server.use('/api/uat-gate', gate);
  return server;
};
const STAND = 'shop.example.com';
const cookieOf = (res) => String(res.headers['set-cookie']?.[0] ?? '').split(';')[0];

beforeEach(() => { version = 1; });

describe('пропуск на стенд', () => {
  it('подходит только своему хосту', async () => {
    const value = await issueGateValue(STAND);
    expect(await checkGateCookie(`uat_gate=${value}`, STAND)).toBe(true);
    expect(await checkGateCookie(`uat_gate=${value}`, 'other.example.com')).toBe(false);
  });

  it('истёкший, подделанный и чужой по версии токенов пропуск не проходит', async () => {
    const old = await issueGateValue(STAND, Date.now() - 31 * 24 * 3600 * 1000);
    expect(await checkGateCookie(`uat_gate=${old}`, STAND)).toBe(false);

    const value = await issueGateValue(STAND);
    const [exp, tv] = value.split('.');
    expect(await checkGateCookie(`uat_gate=${exp}.${tv}.${'0'.repeat(64)}`, STAND)).toBe(false);
    expect(await checkGateCookie(`uat_gate=${Number(exp) + 100}.${tv}.${value.split('.')[2]}`, STAND)).toBe(false);
    expect(await checkGateCookie('', STAND)).toBe(false);
    expect(await checkGateCookie('uat_gate=abc', STAND)).toBe(false);

    version = 2;
    expect(await checkGateCookie(`uat_gate=${value}`, STAND)).toBe(false);
  });

  it('не JWT: как токен владельца его не принять', async () => {
    expect((await issueGateValue(STAND)).split('.')).toHaveLength(3);
    expect(await issueGateValue(STAND)).not.toMatch(/^eyJ/);
  });
});

describe('маршруты входа на стенд', () => {
  it('форма входа: пароль, скрытый путь возврата и защита от открытых редиректов', async () => {
    const res = await request(app()).get('/api/uat-gate/login?next=//evil.example').set('Host', STAND);

    expect(res.status).toBe(200);
    expect(res.text).toContain('name="password"');
    expect(res.text).toContain('name="next" value="/"');
    expect(res.headers['cache-control']).toBe('no-store');

    const ok = await request(app()).get('/api/uat-gate/login?next=/orders?id=1').set('Host', STAND);
    expect(ok.text).toContain('value="/orders?id=1"');
  });

  it('верный пароль: пропуск в cookie и переход на запрошенный путь', async () => {
    const res = await request(app()).post('/api/uat-gate/login').set('Host', STAND).type('form').send({ password: 'owner-password', next: '/orders' });

    expect(res.status).toBe(303);
    expect(res.headers.location).toBe('/orders');
    const header = res.headers['set-cookie'][0];
    expect(header).toMatch(/^uat_gate=/);
    expect(header).toMatch(/HttpOnly/);
    expect(header).toMatch(/Secure/);
    expect(header).toMatch(/SameSite=Lax/);
  });

  it('неверный пароль: 401 с формой и без cookie', async () => {
    const res = await request(app()).post('/api/uat-gate/login').set('Host', STAND).type('form').send({ password: 'nope', next: '/' });

    expect(res.status).toBe(401);
    expect(res.text).toContain('Неверный пароль');
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('открытый редирект через next не работает', async () => {
    const res = await request(app()).post('/api/uat-gate/login').set('Host', STAND).type('form').send({ password: 'owner-password', next: 'https://evil.example' });

    expect(res.headers.location).toBe('/');
  });

  it('проверка для nginx: без пропуска 401, с пропуском 204, чужой хост 401', async () => {
    const login = await request(app()).post('/api/uat-gate/login').set('Host', STAND).type('form').send({ password: 'owner-password' });
    const cookie = cookieOf(login);

    expect((await request(app()).get('/api/uat-gate/check').set('Host', STAND)).status).toBe(401);
    expect((await request(app()).get('/api/uat-gate/check').set('Host', STAND).set('Cookie', cookie)).status).toBe(204);
    expect((await request(app()).get('/api/uat-gate/check').set('Host', 'other.example.com').set('Cookie', cookie)).status).toBe(401);
  });

  it('адреса вне домена стендов (в том числе сам трекер) не обслуживаются', async () => {
    expect((await request(app()).get('/api/uat-gate/login').set('Host', 'tracker.example.org')).status).toBe(404);
    expect((await request(app()).get('/api/uat-gate/login').set('Host', 'example.com')).status).toBe(404);
    expect((await request(app()).post('/api/uat-gate/login').set('Host', 'example.com').type('form').send({ password: 'owner-password' })).status).toBe(404);
  });
});
