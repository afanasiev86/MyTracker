import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';

// Запускается, только если задан MONGO_URL_TEST (токены хранят версию в базе)
const MONGO_URL_TEST = process.env.MONGO_URL_TEST;
const describeDb = MONGO_URL_TEST ? describe : describe.skip;

describeDb('вход и отзыв токенов', () => {
  let app;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.ADMIN_PASSWORD = 'test-password';
    await mongoose.connect(MONGO_URL_TEST);
    await mongoose.connection.db.dropDatabase();
    app = createApp();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('возвращает токен при верном пароле', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'test-password' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  it('пускает с действующим токеном', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ password: 'test-password' });
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
  });

  it('после отзыва старый токен перестаёт работать', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ password: 'test-password' });
    const token = login.body.token;

    const revoked = await request(app)
      .post('/api/auth/revoke')
      .set('Authorization', `Bearer ${token}`);
    expect(revoked.status).toBe(200);

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
