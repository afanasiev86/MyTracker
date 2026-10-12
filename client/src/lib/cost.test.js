import { describe, it, expect } from 'vitest';
import { sumRunCosts, formatUsd } from './cost.js';

describe('стоимость', () => {
  it('суммирует запуски и пропускает запуски без стоимости', () => {
    expect(sumRunCosts([{ costUsd: 0.5 }, {}, { costUsd: 0.25 }])).toBe(0.75);
  });

  it('для пустого списка возвращает ноль', () => {
    expect(sumRunCosts()).toBe(0);
    expect(sumRunCosts([])).toBe(0);
  });

  it('форматирует в доллары с двумя знаками', () => {
    expect(formatUsd(0.7)).toBe('$0.70');
    expect(formatUsd(12.345)).toBe('$12.35');
  });
});
