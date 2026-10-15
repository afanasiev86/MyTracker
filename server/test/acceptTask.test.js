import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Приёмка: перенос результата из UAT в основную ветку. Git и база подменены, проверяется только логика решения.
process.env.REPOS_DIR = '/srv/repos';
const promoteToBase = jest.fn();
jest.unstable_mockModule('../src/services/projects/baseBranch.js', () => ({ baseBranch: async () => 'main' }));
jest.unstable_mockModule('../src/worker/promote.js', () => ({ promoteToBase }));

const { acceptTask } = await import('../src/services/runs/acceptTask.js');

const makeTask = (extra = {}) => ({
  status: 'review', project: 'shop', branch: 'uat', commits: ['a1', 'b2'], save: jest.fn(async () => {}), ...extra,
});

beforeEach(() => promoteToBase.mockReset());

describe('acceptTask', () => {
  it('принять можно только задачу на проверке', async () => {
    const task = makeTask({ status: 'ready' });
    expect(await acceptTask(task)).toEqual({ error: 'Принять можно только задачу на проверке' });
    expect(task.save).not.toHaveBeenCalled();
  });

  it('результат в UAT: коммиты задачи переносятся в основную ветку, задача принята', async () => {
    promoteToBase.mockResolvedValue({ ok: true });
    const task = makeTask();

    const result = await acceptTask(task);

    expect(promoteToBase).toHaveBeenCalledWith('/srv/repos/shop', { base: 'main', commits: ['a1', 'b2'] });
    expect(result.error).toBeUndefined();
    expect(task).toMatchObject({ status: 'done', branch: 'main' });
    expect(task.save).toHaveBeenCalledTimes(1);
  });

  it('результат уже в основной ветке (проект пушит сразу в ПРОД): переноса нет, меняется только статус', async () => {
    const task = makeTask({ branch: 'main' });

    await acceptTask(task);

    expect(promoteToBase).not.toHaveBeenCalled();
    expect(task.status).toBe('done');
  });

  it('конфликт: задача остаётся на проверке, причина в ответе', async () => {
    promoteToBase.mockResolvedValue({ ok: false, reason: 'conflict', error: 'CONFLICT (content): a.txt' });
    const task = makeTask();

    const result = await acceptTask(task);

    expect(result.error).toMatch(/конфликт с основной веткой.*a\.txt/);
    expect(task.status).toBe('review');
    expect(task.save).not.toHaveBeenCalled();
  });

  it('нет сохранённых коммитов: перенос не пытается угадывать, задача остаётся на проверке', async () => {
    const task = makeTask({ commits: [] });

    const result = await acceptTask(task);

    expect(result.error).toMatch(/нет сохранённых коммитов/);
    expect(promoteToBase).not.toHaveBeenCalled();
    expect(task.status).toBe('review');
  });
});
