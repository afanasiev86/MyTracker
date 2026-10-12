import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals';

// Интеграция через HTTP без базы: настоящие app, маршруты, middleware авторизации, errorHandler.
// Подменены только места, которые ходят в базу: версия токена, поиск задач и постановка в очередь.
process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_PASSWORD = 'test-password';

// Реальные модули здесь не импортируем до подмены: их цепочки зависимостей тянут проверку токена в базу.
// Подменяем точно те экспорты, которые нужны маршрутам; остальные функции не вызываются.
const findTask = jest.fn();
const enqueueRun = jest.fn();
const otherTaskStoreExports = {
  findTaskLean: jest.fn(), listTasks: jest.fn(), listProjectTasks: jest.fn(), createTask: jest.fn(),
  addTaskComment: jest.fn(), listInProgressTasks: jest.fn(), failInterruptedRun: jest.fn(),
  taskExistsInProject: jest.fn(), taskStatsByProject: jest.fn(), runCostsByProject: jest.fn(),
};
jest.unstable_mockModule('../src/services/store/tasks.js', () => ({ findTask, ...otherTaskStoreExports }));
jest.unstable_mockModule('../src/services/auth/tokenVersion.js', () => ({
  currentTokenVersion: async () => 1,
  revokeAllTokens: jest.fn(async () => 2),
}));
jest.unstable_mockModule('../src/services/runs/enqueueRun.js', () => ({ enqueueRun }));

const request = (await import('supertest')).default;
const { createApp } = await import('../src/app.js');
const { issueToken } = await import('../src/services/auth/tokens.js');

let token;
beforeAll(async () => {
  token = await issueToken('owner');
});

function makeTask(status, extra = {}) {
  return {
    _id: 'task-1',
    project: 'shop',
    priority: 'normal',
    status,
    title: 'Задача',
    queued: false,
    queuedAnswer: '',
    pendingQuestion: '',
    comments: [],
    save: jest.fn(async () => {}),
    toObject() { return { _id: this._id, status: this.status, project: this.project, pendingQuestion: this.pendingQuestion }; },
    ...extra,
  };
}

beforeEach(() => {
  findTask.mockReset();
  enqueueRun.mockReset();
});

const auth = (req) => req.set('Authorization', `Bearer ${token}`);

describe('авторизация задач', () => {
  it('PATCH без токена: 401', async () => {
    const res = await request(createApp()).patch('/api/tasks/task-1').send({ title: 'x' });
    expect(res.status).toBe(401);
    expect(Object.keys(res.body)).toEqual(['error']);
  });
});

describe('PATCH /api/tasks/:id', () => {
  it('задачи нет: 404 и только поле error', async () => {
    findTask.mockResolvedValue(null);
    const res = await auth(request(createApp()).patch('/api/tasks/nope')).send({ title: 'x' });
    expect(res.status).toBe(404);
    expect(Object.keys(res.body)).toEqual(['error']);
  });

  it('ручной перевод в «В работе»: 409 с понятным текстом', async () => {
    findTask.mockResolvedValue(makeTask('ready'));
    const res = await auth(request(createApp()).patch('/api/tasks/task-1')).send({ status: 'in_progress' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/запуском/);
  });

  it('недопустимый переход: 409', async () => {
    findTask.mockResolvedValue(makeTask('review'));
    const res = await auth(request(createApp()).patch('/api/tasks/task-1')).send({ status: 'backlog' });
    expect(res.status).toBe(409);
  });

  it('неизвестный статус отсекает zod на границе: 400', async () => {
    findTask.mockResolvedValue(makeTask('ready'));
    const res = await auth(request(createApp()).patch('/api/tasks/task-1')).send({ status: 'bogus' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('допустимый переход: 200 и сохранённая задача', async () => {
    const task = makeTask('ready');
    findTask.mockResolvedValue(task);
    const res = await auth(request(createApp()).patch('/api/tasks/task-1')).send({ status: 'backlog' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('backlog');
    expect(task.save).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/tasks/:id/question', () => {
  it('вопрос вне работы: 409, только поле error', async () => {
    findTask.mockResolvedValue(makeTask('ready'));
    const res = await auth(request(createApp()).post('/api/tasks/task-1/question')).send({ text: 'Какой цвет?' });
    expect(res.status).toBe(409);
    expect(Object.keys(res.body)).toEqual(['error']);
  });

  it('пустой текст: 400 от zod', async () => {
    findTask.mockResolvedValue(makeTask('in_progress'));
    const res = await auth(request(createApp()).post('/api/tasks/task-1/question')).send({ text: '   ' });
    expect(res.status).toBe(400);
  });

  it('в работе: 201 и вопрос сохранён', async () => {
    const task = makeTask('in_progress');
    findTask.mockResolvedValue(task);
    const res = await auth(request(createApp()).post('/api/tasks/task-1/question')).send({ text: 'Какой цвет?' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true });
    expect(task.pendingQuestion).toBe('Какой цвет?');
  });
});

describe('POST /api/tasks/:id/answer', () => {
  it('задачи нет: 404', async () => {
    findTask.mockResolvedValue(null);
    const res = await auth(request(createApp()).post('/api/tasks/nope/answer')).send({ text: 'да' });
    expect(res.status).toBe(404);
  });

  it('задача не ждёт ответа: 409 с текстом сервиса', async () => {
    findTask.mockResolvedValue(makeTask('in_progress'));
    const res = await auth(request(createApp()).post('/api/tasks/task-1/answer')).send({ text: 'да' });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Задача сейчас не ждёт ответа' });
    expect(enqueueRun).not.toHaveBeenCalled();
  });

  it('ответ на «Нужен ответ»: 202, запуск поставлен в очередь с ответом', async () => {
    findTask.mockResolvedValue(makeTask('waiting', { pendingQuestion: 'Какой цвет?' }));
    const res = await auth(request(createApp()).post('/api/tasks/task-1/answer')).send({ text: 'синий' });
    expect(res.status).toBe(202);
    expect(res.body.status).toBe('in_progress');
    expect(enqueueRun).toHaveBeenCalledWith(expect.objectContaining({ queuedAnswer: 'синий' }), 'синий');
  });

  it('пустой ответ: 400 от zod, ничего не ставится в очередь', async () => {
    findTask.mockResolvedValue(makeTask('waiting'));
    const res = await auth(request(createApp()).post('/api/tasks/task-1/answer')).send({ text: '' });
    expect(res.status).toBe(400);
    expect(enqueueRun).not.toHaveBeenCalled();
  });
});
