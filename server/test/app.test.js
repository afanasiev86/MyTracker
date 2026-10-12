import request from 'supertest';
import { createApp } from '../src/app.js';
import { checkPassword } from '../src/services/auth.js';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.ADMIN_PASSWORD = 'test-password';
});

describe('health', () => {
  it('отвечает ok без авторизации', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
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
