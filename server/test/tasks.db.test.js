import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { issueToken } from '../src/services/auth/tokens.js';
import Project from '../src/models/Project.js';

// Запускается, только если задан MONGO_URL_TEST (в CI поднимается сервис MongoDB)
const MONGO_URL_TEST = process.env.MONGO_URL_TEST;
const describeDb = MONGO_URL_TEST ? describe : describe.skip;

describeDb('API задач с базой', () => {
  let app;
  let auth;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    await mongoose.connect(MONGO_URL_TEST);
    app = createApp();
    auth = `Bearer ${await issueToken('owner')}`;
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    await Project.create({ slug: 'shop', name: 'Магазин' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  async function createTask(extra = {}) {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', auth)
      .send({ project: 'shop', title: 'Фильтр по цене', ...extra });
    expect(res.status).toBe(201);
    return res.body;
  }

  it('создаёт задачу в бэклоге', async () => {
    const task = await createTask({ acceptance: ['Фильтр работает'] });
    expect(task.status).toBe('backlog');
    expect(task.acceptance).toEqual(['Фильтр работает']);
  });

  it('разрешает бэклог → готово к работе', async () => {
    const task = await createTask();
    const res = await request(app)
      .patch(`/api/tasks/${task._id}`)
      .set('Authorization', auth)
      .send({ status: 'ready' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
  });

  it('отклоняет недопустимый переход', async () => {
    const task = await createTask();
    const res = await request(app)
      .patch(`/api/tasks/${task._id}`)
      .set('Authorization', auth)
      .send({ status: 'done' });
    expect(res.status).toBe(409);
  });

  it('отклоняет ручной перевод в «В работе»', async () => {
    const task = await createTask();
    const res = await request(app)
      .patch(`/api/tasks/${task._id}`)
      .set('Authorization', auth)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(409);
  });

  it('не даёт запустить задачу из бэклога', async () => {
    const task = await createTask();
    const res = await request(app)
      .post(`/api/tasks/${task._id}/run`)
      .set('Authorization', auth);
    expect(res.status).toBe(409);
  });

  it('добавляет комментарий', async () => {
    const task = await createTask();
    const res = await request(app)
      .post(`/api/tasks/${task._id}/comments`)
      .set('Authorization', auth)
      .send({ text: 'Уточнение' });
    expect(res.status).toBe(201);
    expect(res.body.text).toBe('Уточнение');
  });

  it('возвращает 404 для несуществующей задачи', async () => {
    const res = await request(app)
      .get('/api/tasks/64b000000000000000000000')
      .set('Authorization', auth);
    expect(res.status).toBe(404);
  });

  it('считает стоимость запусков по проектам', async () => {
    await mongoose.connection.db.collection('tasks').insertOne({
      project: 'shop',
      title: 'x',
      status: 'review',
      runs: [{ costUsd: 0.5 }, { costUsd: 0.25 }],
    });
    const res = await request(app).get('/api/stats/costs').set('Authorization', auth);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ project: 'shop', costUsd: 0.75, runs: 2 }]);
  });
});
