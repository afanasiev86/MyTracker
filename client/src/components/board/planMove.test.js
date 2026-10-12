import { describe, it, expect } from 'vitest';
import { planMove } from './planMove.js';
import { orderKey } from '../../../../shared/taskOrder.js';

const task = (id, status, updatedAt) => ({ _id: id, status, updatedAt });
const tasks = [
  task('a', 'backlog', '2026-10-05T00:00:00Z'),
  task('b', 'backlog', '2026-10-04T00:00:00Z'),
  task('c', 'backlog', '2026-10-03T00:00:00Z'),
  task('r1', 'ready', '2026-10-02T00:00:00Z'),
  task('r2', 'ready', '2026-10-01T00:00:00Z'),
];
const boardOf = (status) => ({
  id: status,
  cards: tasks.filter((t) => t.status === status).map((t) => ({ id: t._id })),
});
const boards = { backlog: boardOf('backlog'), ready: boardOf('ready'), done: boardOf('done') };
const byId = Object.fromEntries(tasks.map((t) => [t._id, t]));

describe('planMove', () => {
  it('перестановка внутри колонки ставит order между новыми соседями', () => {
    const plan = planMove(boards, tasks, { cardId: 'a', fromBoardId: 'backlog', toBoardId: 'backlog', toIndex: 2 });
    expect(plan.patch.status).toBeUndefined();
    expect(plan.patch.order).toBeGreaterThan(orderKey(byId.b));
    expect(plan.patch.order).toBeLessThan(orderKey(byId.c));
  });

  it('перенос в другую колонку на позицию меняет статус и ставит между соседями', () => {
    const plan = planMove(boards, tasks, { cardId: 'a', fromBoardId: 'backlog', toBoardId: 'ready', toIndex: 1 });
    expect(plan.patch.status).toBe('ready');
    expect(plan.patch.order).toBeGreaterThan(orderKey(byId.r1));
    expect(plan.patch.order).toBeLessThan(orderKey(byId.r2));
  });

  it('карточка, брошенная на своё же место, ничего не меняет', () => {
    expect(planMove(boards, tasks, { cardId: 'b', fromBoardId: 'backlog', toBoardId: 'backlog', toIndex: 1 })).toEqual({ skip: true });
    expect(planMove(boards, tasks, { cardId: 'b', fromBoardId: 'backlog', toBoardId: 'backlog', toIndex: 2 })).toEqual({ skip: true });
  });

  it('в колонку, куда статус вручную не меняется, переносить нельзя', () => {
    const plan = planMove(boards, tasks, { cardId: 'a', fromBoardId: 'backlog', toBoardId: 'done', toIndex: 0 });
    expect(plan.error).toMatch(/Нельзя перенести/);
    expect(plan.patch).toBeUndefined();
  });

  it('в пустую разрешённую колонку встаёт первой', () => {
    const plan = planMove(boards, tasks, { cardId: 'r1', fromBoardId: 'ready', toBoardId: 'backlog', toIndex: 0 });
    expect(plan.patch.status).toBe('backlog');
    expect(plan.patch.order).toBeLessThan(orderKey(byId.a));
  });
});
