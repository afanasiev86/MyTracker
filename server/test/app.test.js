import os from 'node:os';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { checkPassword } from '../src/services/auth/password.js';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.ADMIN_PASSWORD = 'test-password';
  process.env.ATTACHMENTS_DIR = os.tmpdir();
});

describe('health', () => {
  it('публичная проверка отвечает без авторизации и только признаками работы', async () => {
    const res = await request(createApp()).get('/api/health');
    // Без базы в тесте статус 503, но формат ответа одинаковый
    expect([200, 503]).toContain(res.status);
    expect(typeof res.body.ok).toBe('boolean');
    expect(Object.keys(res.body.checks).sort()).toEqual(['claude', 'mongo', 'storage', 'telegram']);
    for (const value of Object.values(res.body.checks)) expect(typeof value).toBe('boolean');
  });

  it('подробности доступны только владельцу с токеном', async () => {
    const res = await request(createApp()).get('/api/health/details');
    expect(res.status).toBe(401);
  });
});

describe('auth guard', () => {
  it('отклоняет запрос к задачам без токена', async () => {
    const res = await request(createApp()).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('отклоняет поддельный токен', async () => {
    const res = await request(createApp())
      .get('/api/tasks')
      .set('Authorization', 'Bearer not-a-token');
    expect(res.status).toBe(401);
  });

});

describe('login', () => {
  it('возвращает 401 при неверном пароле', async () => {
    const res = await request(createApp())
      .post('/api/auth/login')
      .send({ password: 'wrong' });
    expect(res.status).toBe(401);
  });

});

describe('checkPassword', () => {
  it('сравнивает пароль и не принимает пустой', () => {
    expect(checkPassword('test-password')).toBe(true);
    expect(checkPassword('test-passwor')).toBe(false);
    expect(checkPassword('')).toBe(false);
  });
});
