import { describe, it, expect } from '@jest/globals';
import { orderKey, sortByOrder, orderBetween } from '../../shared/taskOrder.js';

const task = (id, updatedAt, order) => ({ id, updatedAt, ...(order === undefined ? {} : { order }) });

describe('порядок карточек на доске', () => {
  it('без ручной сортировки новее выше', () => {
    const list = [task('old', '2026-10-01T00:00:00Z'), task('new', '2026-10-05T00:00:00Z')];
    expect(sortByOrder(list).map((t) => t.id)).toEqual(['new', 'old']);
  });

  it('явный order встаёт между задачами без order', () => {
    const newer = task('newer', '2026-10-05T00:00:00Z');
    const older = task('older', '2026-10-01T00:00:00Z');
    const moved = task('moved', '2026-10-09T00:00:00Z', orderBetween(newer, older));
    expect(sortByOrder([older, moved, newer]).map((t) => t.id)).toEqual(['newer', 'moved', 'older']);
  });

  it('orderBetween: наверх, вниз и в пустую колонку', () => {
    const a = task('a', '2026-10-05T00:00:00Z');
    const b = task('b', '2026-10-01T00:00:00Z');
    expect(orderBetween(null, a)).toBeLessThan(orderKey(a));
    expect(orderBetween(b, null)).toBeGreaterThan(orderKey(b));
    expect(Number.isFinite(orderBetween(null, null))).toBe(true);
  });

  it('сортировка не меняет исходный массив', () => {
    const list = [task('old', '2026-10-01T00:00:00Z'), task('new', '2026-10-05T00:00:00Z')];
    sortByOrder(list);
    expect(list[0].id).toBe('old');
  });
});
