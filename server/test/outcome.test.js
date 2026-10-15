import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, it, expect, afterEach } from '@jest/globals';
import { resolveOutcome } from '../src/worker/outcome.js';

// Рабочая копия с одним коммитом на HEAD: достаточно, чтобы проверить решение
// resolveOutcome при нуле новых коммитов за запуск (startPoint === HEAD).
async function repoWithCommit(message) {
  const wt = await fs.mkdtemp(path.join(os.tmpdir(), 'mt-outcome-'));
  execFileSync('git', ['init', '-q', '-b', 'main', wt]);
  execFileSync('git', ['-C', wt, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', message]);
  return wt;
}

const base = { res: { code: 0, stdout: '', stderr: '' }, data: { is_error: false, result: 'Готово' }, question: '', cfg: {}, startPoint: 'HEAD', branch: 'task/abc123', base: 'main', log: '', costUsd: 0 };

describe('resolveOutcome: ноль новых коммитов за запуск', () => {
  const dirs = [];
  afterEach(async () => {
    await Promise.all(dirs.splice(0).map((d) => fs.rm(d, { recursive: true, force: true })));
  });

  it('если коммит этой задачи уже есть в истории — не ошибка, а «на проверке»: работу уже сделал прошлый запуск', async () => {
    const wt = await repoWithCommit('task(abc123): Добавить логотип приложения');
    dirs.push(wt);
    const outcome = await resolveOutcome({ ...base, wt, taskId: 'abc123' });
    expect(outcome.status).toBe('review');
    expect(outcome.summary).toBe('Готово');
  });

  it('если коммита этой задачи в истории нет — это настоящий сбой: Claude ничего не сделал', async () => {
    const wt = await repoWithCommit('случайный коммит без отношения к задаче');
    dirs.push(wt);
    const outcome = await resolveOutcome({ ...base, wt, taskId: 'abc123' });
    expect(outcome.status).toBe('failed');
    expect(outcome.summary).toBe('Claude не создал коммитов.');
  });

  it('коммит другой задачи в истории не засчитывается', async () => {
    const wt = await repoWithCommit('task(other999): Другая задача');
    dirs.push(wt);
    const outcome = await resolveOutcome({ ...base, wt, taskId: 'abc123' });
    expect(outcome.status).toBe('failed');
  });
});
