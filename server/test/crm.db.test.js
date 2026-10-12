import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { issueToken } from '../src/services/auth.js';

// Запускается, только если задан MONGO_URL_TEST (в CI поднимается сервис MongoDB)
const MONGO_URL_TEST = process.env.MONGO_URL_TEST;
const describeDb = MONGO_URL_TEST ? describe : describe.skip;

describeDb('CRM: клиенты и проекты', () => {
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
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  async function post(path, body) {
    return request(app).post(path).set('Authorization', auth).send(body);
  }

  it('создаёт клиента с условиями оплаты и выводит его в списке', async () => {
    const created = await post('/api/clients', {
      name: 'Иван',
      company: 'ООО Ромашка',
      rate: { kind: 'hourly', amount: 2000, currency: 'RUB' },
    });
    expect(created.status).toBe(201);

    const list = await request(app).get('/api/clients').set('Authorization', auth);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].rate.amount).toBe(2000);
    expect(list.body[0].costUsd).toBe(0);
  });

  it('создаёт проект, привязанный к клиенту', async () => {
    const client = (await post('/api/clients', { name: 'Иван' })).body;
    const res = await post('/api/projects', { slug: 'shop-api', name: 'Магазин', client: client._id });
    expect(res.status).toBe(201);
    expect(res.body.client).toBe(client._id);
  });

  it('отклоняет slug с недопустимыми символами', async () => {
    const res = await post('/api/projects', { slug: 'Shop API!', name: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Латиница/);
  });

  it('не даёт создать два проекта с одним slug', async () => {
    await post('/api/projects', { slug: 'shop', name: 'Раз' });
    const res = await post('/api/projects', { slug: 'shop', name: 'Два' });
    expect(res.status).toBe(409);
  });

  it('не создаёт задачу в несуществующем проекте', async () => {
    const res = await post('/api/tasks', { project: 'ghost', title: 'Задача' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/не найден/);
  });

  it('создаёт задачу в существующем проекте с приоритетом и сроком', async () => {
    await post('/api/projects', { slug: 'shop', name: 'Магазин' });
    const res = await post('/api/tasks', {
      project: 'shop',
      title: 'Фильтр',
      priority: 'high',
      dueDate: '2026-11-01T00:00:00.000Z',
      tags: ['frontend'],
    });
    expect(res.status).toBe(201);
    expect(res.body.priority).toBe('high');
    expect(res.body.tags).toEqual(['frontend']);
  });

  it('не даёт удалить клиента, у которого есть проекты', async () => {
    const client = (await post('/api/clients', { name: 'Иван' })).body;
    await post('/api/projects', { slug: 'shop', name: 'Магазин', client: client._id });
    const res = await request(app)
      .delete(`/api/clients/${client._id}`)
      .set('Authorization', auth);
    expect(res.status).toBe(409);
  });

  it('не даёт удалить проект с задачами', async () => {
    const project = (await post('/api/projects', { slug: 'shop', name: 'Магазин' })).body;
    await post('/api/tasks', { project: 'shop', title: 'Задача' });
    const res = await request(app)
      .delete(`/api/projects/${project._id}`)
      .set('Authorization', auth);
    expect(res.status).toBe(409);
  });

  it('не даёт переименовать slug проекта с задачами', async () => {
    const project = (await post('/api/projects', { slug: 'shop', name: 'Магазин' })).body;
    await post('/api/tasks', { project: 'shop', title: 'Задача' });
    const res = await request(app)
      .patch(`/api/projects/${project._id}`)
      .set('Authorization', auth)
      .send({ slug: 'shop-new' });
    expect(res.status).toBe(409);
  });

  it('показывает у проекта число задач и открытых задач', async () => {
    const project = (await post('/api/projects', { slug: 'shop', name: 'Магазин' })).body;
    await post('/api/tasks', { project: 'shop', title: 'Первая' });
    await post('/api/tasks', { project: 'shop', title: 'Вторая' });
    const res = await request(app)
      .get(`/api/projects/${project._id}`)
      .set('Authorization', auth);
    expect(res.body.stats.tasks).toBe(2);
    expect(res.body.stats.open).toBe(2);
    expect(res.body.tasks).toHaveLength(2);
  });
});
