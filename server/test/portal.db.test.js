import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { issueToken } from '../src/services/auth.js';
import Client from '../src/models/Client.js';
import Project from '../src/models/Project.js';
import Task from '../src/models/Task.js';
import AccessRequest from '../src/models/AccessRequest.js';
import { approveAccessRequest, revokePortal } from '../src/services/access.js';

// Запускается, только если задан MONGO_URL_TEST (в CI поднимается сервис MongoDB)
const MONGO_URL_TEST = process.env.MONGO_URL_TEST;
const describeDb = MONGO_URL_TEST ? describe : describe.skip;

describeDb('портал заказчика с базой', () => {
  let app;
  let owner;
  let clientToken;
  let clientDoc;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.TELEGRAM_OWNER_ID = '1';
    await mongoose.connect(MONGO_URL_TEST);
    await mongoose.connection.db.dropDatabase();
    app = createApp();
    owner = `Bearer ${await issueToken('owner')}`;
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    clientDoc = await Client.create({ name: 'Анна' });
    await Project.create({ slug: 'shop', name: 'Магазин', client: clientDoc._id });
    await Project.create({ slug: 'other', name: 'Чужой' });
    await Task.create({ project: 'shop', title: 'Своя', status: 'ready' });
    await Task.create({ project: 'shop', title: 'Черновик', status: 'backlog' });
    await Task.create({ project: 'other', title: 'Чужая', status: 'ready' });
    clientToken = `Bearer ${await issueToken(`client:${clientDoc._id}`, '30d', { role: 'client', clientId: String(clientDoc._id) })}`;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('заказчик не попадает во владельческий API', async () => {
    const res = await request(app).get('/api/tasks').set('Authorization', clientToken);
    expect(res.status).toBe(403);
  });

  it('портал показывает только свои задачи без черновиков', async () => {
    const res = await request(app).get('/api/portal/tasks').set('Authorization', clientToken);
    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.title)).toEqual(['Своя']);
  });

  it('владелец не видит портал заказчика', async () => {
    const res = await request(app).get('/api/portal/tasks').set('Authorization', owner);
    expect(res.status).toBe(403);
  });

  it('после подтверждения запрос становится доступом, после закрытия — нет', async () => {
    await Client.updateOne({ _id: clientDoc._id }, { $unset: { telegramId: 1 }, $set: { portalApproved: false } });
    const req = await AccessRequest.create({ telegramId: '555', name: 'Анна' });
    expect(await approveAccessRequest(req._id, clientDoc._id)).toEqual({ ok: true });
    const approved = await Client.findById(clientDoc._id).lean();
    expect(approved.portalApproved).toBe(true);
    expect(approved.telegramId).toBe('555');

    await revokePortal(clientDoc._id);
    const res = await request(app).get('/api/portal/tasks').set('Authorization', clientToken);
    expect(res.status).toBe(403);
  });

  it('комментарий заказчика виден владельцу и не уходит чужим задачам', async () => {
    const own = await Task.findOne({ title: 'Своя' });
    const other = await Task.findOne({ title: 'Чужая' });
    const ok = await request(app)
      .post(`/api/portal/tasks/${own._id}/comments`).set('Authorization', clientToken).send({ text: 'Когда готово?' });
    expect(ok.status).toBe(201);
    const denied = await request(app)
      .post(`/api/portal/tasks/${other._id}/comments`).set('Authorization', clientToken).send({ text: 'Привет' });
    expect(denied.status).toBe(404);

    const fresh = await Task.findById(own._id).lean();
    expect(fresh.comments.at(-1)).toMatchObject({ author: 'client', text: 'Когда готово?' });
  });
});
