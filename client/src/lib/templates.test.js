import { describe, it, expect } from 'vitest';
import { applyTemplate } from './templates.js';

const EMPTY = { goal: '', acceptance: '', outOfScope: '', context: '' };

describe('шаблоны задач', () => {
  it('заполняет пустые поля текстом шаблона', () => {
    const out = applyTemplate(EMPTY, 'bug');
    expect(out.goal).toContain('Исправить ошибку');
    expect(out.acceptance.split('\n')).toHaveLength(3);
  });

  it('шаблон выставляет тип задачи', () => {
    expect(applyTemplate(EMPTY, 'refactor').kind).toBe('refactor');
    expect(applyTemplate({ ...EMPTY, kind: 'feature' }, 'bug').kind).toBe('bug');
  });

  it('не перезаписывает уже написанный текст', () => {
    const out = applyTemplate({ ...EMPTY, goal: 'Своя цель' }, 'feature');
    expect(out.goal).toBe('Своя цель');
  });

  it('неизвестный шаблон ничего не меняет', () => {
    expect(applyTemplate(EMPTY, 'нет-такого')).toEqual(EMPTY);
  });
});
