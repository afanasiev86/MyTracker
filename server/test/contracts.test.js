import { describe, it, expect } from '@jest/globals';
import { PortalTaskSchema } from '../../shared/contracts.js';
import { toClientTask } from '../src/services/portal/toClientTask.js';

describe('контракт ответов API', () => {
  it('задача в портале содержит только поля контракта, внутренние данные запуска не утекают', () => {
    const task = {
      _id: 'abc',
      title: 'Форма заказа',
      goal: 'Сделать форму',
      acceptance: ['Отправляется'],
      status: 'in_progress',
      dueDate: null,
      updatedAt: new Date(),
      // Внутреннее: заказчику не показываем
      branch: 'task/abc',
      progress: 'Запуск…',
      runs: [{ costUsd: 1.5, log: 'секрет' }],
      comments: [
        { author: 'client', text: 'Когда готово?', createdAt: new Date() },
        { author: 'owner', text: 'внутренний комментарий', visibleToClient: false },
        { author: 'owner', text: 'видно заказчику', visibleToClient: true, createdAt: new Date() },
      ],
    };
    const out = toClientTask(task, 'Магазин');
    expect(() => PortalTaskSchema.parse(out)).not.toThrow();
    expect(out.comments.map((c) => c.text)).toEqual(['Когда готово?', 'видно заказчику']);
  });

  it('схема отклоняет лишнее поле, например стоимость запусков', () => {
    const out = toClientTask({ _id: 'x', title: 't', goal: '', acceptance: [], status: 'ready', comments: [] }, 'p');
    expect(() => PortalTaskSchema.parse({ ...out, runs: [] })).toThrow();
  });
});
