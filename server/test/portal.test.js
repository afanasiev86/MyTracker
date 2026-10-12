import { toClientTask } from '../src/services/portal.js';
import { requireOwner, requireClient } from '../src/middleware/roles.js';
import { CLIENT_STATUS_LABELS, TASK_STATUSES } from '../../shared/statuses.js';

const task = {
  _id: 't1',
  title: 'Форма заказа',
  goal: 'Сделать форму',
  acceptance: ['Отправляется'],
  status: 'review',
  dueDate: null,
  updatedAt: new Date('2026-10-01'),
  runs: [{ costUsd: 0.5, log: 'секрет' }],
  progress: 'Bash: npm test',
  branch: 'task/t1',
  comments: [
    { author: 'owner', text: 'внутреннее', visibleToClient: false, createdAt: new Date() },
    { author: 'owner', text: 'для заказчика', visibleToClient: true, createdAt: new Date() },
    { author: 'client', text: 'Вопрос', visibleToClient: true, createdAt: new Date() },
    { author: 'system', text: 'Сервер перезапущен', visibleToClient: false, createdAt: new Date() },
  ],
};

describe('портал: что видит заказчик', () => {
  it('не отдаёт запуски, стоимость, логи, прогресс и ветку', () => {
    const out = toClientTask(task, 'Магазин');
    const json = JSON.stringify(out);
    for (const secret of ['costUsd', 'секрет', 'Bash: npm test', 'task/t1', 'runs', 'branch']) {
      expect(json).not.toContain(secret);
    }
  });

  it('показывает комментарии заказчика и отмеченные владельцем, остальные скрывает', () => {
    const out = toClientTask(task, 'Магазин');
    const texts = out.comments.map((c) => c.text);
    expect(texts).toEqual(['для заказчика', 'Вопрос']);
    expect(out.comments.every((c) => ['client', 'owner'].includes(c.author))).toBe(true);
  });

  it('переводит статусы в понятные заказчику подписи', () => {
    expect(toClientTask(task, 'Магазин').statusLabel).toBe('На проверке');
    for (const status of TASK_STATUSES) {
      expect(CLIENT_STATUS_LABELS[status]).toBeTruthy();
    }
  });
});

describe('портал: роли токена', () => {
  function fakeRes() {
    return {
      code: null,
      status(c) { this.code = c; return this; },
      json() { return this; },
    };
  }

  it('владельцу и воркеру доступен владельческий API', () => {
    let called = false;
    requireOwner({ user: { sub: 'owner' } }, fakeRes(), () => { called = true; });
    requireOwner({ user: { sub: 'worker' } }, fakeRes(), () => { called = true; });
    expect(called).toBe(true);
  });

  it('заказчику владельческий API закрыт, а портал открыт', () => {
    const res = fakeRes();
    let passed = false;
    requireOwner({ user: { sub: 'client:1', role: 'client' } }, res, () => { passed = true; });
    expect(passed).toBe(false);
    expect(res.code).toBe(403);

    let portal = false;
    requireClient({ user: { role: 'client' } }, fakeRes(), () => { portal = true; });
    expect(portal).toBe(true);
  });

  it('владелец не попадает на портал заказчика', () => {
    const res = fakeRes();
    let passed = false;
    requireClient({ user: { sub: 'owner' } }, res, () => { passed = true; });
    expect(passed).toBe(false);
    expect(res.code).toBe(403);
  });
});
