import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { issueToken } from '../src/services/auth/tokens.js';
import Project from '../src/models/Project.js';
import Task from '../src/models/Task.js';

// Запускается, только если задан MONGO_URL_TEST (в CI поднимается сервис MongoDB)
const MONGO_URL_TEST = process.env.MONGO_URL_TEST;
const describeDb = MONGO_URL_TEST ? describe : describe.skip;

describeDb('вопросы, ответы и отмена', () => {
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

  async function taskIn(status) {
    return Task.create({ project: 'shop', title: 'Задача', status });
  }

  it('задать вопрос можно только во время работы', async () => {
    const task = await taskIn('ready');
    const res = await request(app)
      .post(`/api/tasks/${task._id}/question`)
      .set('Authorization', auth)
      .send({ text: 'Какой формат?' });
    expect(res.status).toBe(409);
  });

  it('вопрос сохраняется в задаче во время работы', async () => {
    const task = await taskIn('in_progress');
    const res = await request(app)
      .post(`/api/tasks/${task._id}/question`)
      .set('Authorization', auth)
      .send({ text: 'Какой формат цены?' });
    expect(res.status).toBe(201);

    const saved = await Task.findById(task._id).lean();
    expect(saved.pendingQuestion).toBe('Какой формат цены?');
  });

  it('ответить можно только на задачу, которая ждёт ответа', async () => {
    const task = await taskIn('in_progress');
    const res = await request(app)
      .post(`/api/tasks/${task._id}/answer`)
      .set('Authorization', auth)
      .send({ text: 'Рубли' });
    expect(res.status).toBe(409);
  });

  it('отменить можно только задачу в работе', async () => {
    const task = await taskIn('backlog');
    const res = await request(app)
      .post(`/api/tasks/${task._id}/cancel`)
      .set('Authorization', auth);
    expect(res.status).toBe(409);
  });

  it('отмена без работающего процесса переводит задачу в ошибку', async () => {
    const task = await taskIn('in_progress');
    const res = await request(app)
      .post(`/api/tasks/${task._id}/cancel`)
      .set('Authorization', auth);
    expect(res.status).toBe(202);
    expect(res.body.task.status).toBe('failed');
  });

  it('пустой ответ отклоняется', async () => {
    const task = await taskIn('waiting');
    const res = await request(app)
      .post(`/api/tasks/${task._id}/answer`)
      .set('Authorization', auth)
      .send({ text: '   ' });
    expect(res.status).toBe(400);
  });
});
