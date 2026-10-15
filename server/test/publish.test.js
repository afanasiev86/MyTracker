import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prepareWorkdir } from '../src/worker/worktree.js';
import { publishToBase } from '../src/worker/publish.js';
import { promoteToBase } from '../src/worker/promote.js';
import { resolveOutcome } from '../src/worker/outcome.js';
import { taskDiff } from '../src/services/diff.js';

// Настоящий git: «GitHub» (bare), клон сервера (shop) и рабочая копия задачи.
const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
const originLog = (root, branch = 'init') => git(path.join(root, 'origin.git'), 'log', branch, '--format=%s');
const originHas = (root, branch) => git(path.join(root, 'origin.git'), 'branch', '--list', branch).trim() !== '';

describe('отправка результата задачи в основную ветку проекта', () => {
  let root;
  let repo;
  let wt;
  let other;

  async function commitIn(dir, file, text, message) {
    await fs.writeFile(path.join(dir, file), text);
    git(dir, 'add', file);
    git(dir, 'commit', '-q', '-m', message);
  }

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'mt-pub-'));
    const originDir = path.join(root, 'origin.git');
    execFileSync('git', ['init', '-q', '--bare', '-b', 'init', originDir]);
    const seed = path.join(root, 'seed');
    execFileSync('git', ['clone', '-q', originDir, seed]);
    git(seed, 'config', 'user.name', 'seed');
    git(seed, 'config', 'user.email', 'seed@example.com');
    await commitIn(seed, 'a.txt', 'one\n', 'first');
    git(seed, 'push', '-q', 'origin', 'HEAD:init');

    repo = path.join(root, 'shop');
    execFileSync('git', ['clone', '-q', originDir, repo]);
    git(repo, 'config', 'user.name', 'worker');
    git(repo, 'config', 'user.email', 'worker@example.com');
    other = path.join(root, 'other');
    execFileSync('git', ['clone', '-q', originDir, other]);
    git(other, 'config', 'user.name', 'owner');
    git(other, 'config', 'user.email', 'owner@example.com');

    wt = repo;
    await prepareWorkdir(repo, 'task/1', 'init', 'init');
  });

  afterEach(() => fs.rm(root, { recursive: true, force: true }));

  it('коммиты уходят в основную ветку, ветки задачи на GitHub не остаётся', async () => {
    await commitIn(wt, 'b.txt', 'two\n', 'task: add b');
    const res = await publishToBase(wt, { branch: 'task/1', base: 'init' });

    expect(res.ok).toBe(true);
    expect(res.commits).toBe(1);
    expect(originLog(root)).toContain('task: add b');
    expect(originHas(root, 'task/1')).toBe(false);
    expect(git(repo, 'diff', `${res.from}..${res.to}`)).toContain('b.txt');
  });

  it('если основную ветку успели обновить, коммиты перекладываются поверх без merge-коммита', async () => {
    await commitIn(wt, 'b.txt', 'two\n', 'task: add b');
    await commitIn(other, 'c.txt', 'three\n', 'owner: add c');
    git(other, 'push', '-q', 'origin', 'HEAD:init');

    const res = await publishToBase(wt, { branch: 'task/1', base: 'init' });

    expect(res.ok).toBe(true);
    const log = originLog(root);
    expect(log).toContain('task: add b');
    expect(log).toContain('owner: add c');
    expect(git(path.join(root, 'origin.git'), 'rev-list', '--merges', '--count', 'init').trim()).toBe('0');
  });

  it('при конфликте основная ветка не меняется, работа сохраняется в ветке задачи, рабочая копия чистая', async () => {
    await commitIn(wt, 'a.txt', 'mine\n', 'task: edit a');
    await commitIn(other, 'a.txt', 'theirs\n', 'owner: edit a');
    git(other, 'push', '-q', 'origin', 'HEAD:init');

    const res = await publishToBase(wt, { branch: 'task/1', base: 'init' });

    expect(res.ok).toBe(false);
    expect(res.reason).toBe('conflict');
    expect(originLog(root)).not.toContain('task: edit a');
    expect(originHas(root, 'task/1')).toBe(true);
    expect(originLog(root, 'task/1')).toContain('task: edit a');
    expect(git(wt, 'status', '--porcelain').trim()).toBe('');
    expect(git(wt, 'status')).not.toMatch(/rebase in progress/);
  });

  it('если ветку защитили от записи, основная ветка не меняется, работа сохраняется в ветке задачи', async () => {
    const hook = path.join(root, 'origin.git', 'hooks', 'pre-receive');
    await fs.writeFile(hook, '#!/bin/sh\nwhile read old new ref; do\n  if [ "$ref" = "refs/heads/init" ]; then echo "protected branch" >&2; exit 1; fi\ndone\n');
    await fs.chmod(hook, 0o755);
    await commitIn(wt, 'b.txt', 'two\n', 'task: add b');

    const res = await publishToBase(wt, { branch: 'task/1', base: 'init' });

    expect(res.ok).toBe(false);
    expect(res.reason).toBe('push');
    expect(originLog(root)).not.toContain('task: add b');
    expect(originLog(root, 'task/1')).toContain('task: add b');
  });

  it('после вопроса Claude черновая ветка задачи удаляется, когда результат влит в основную', async () => {
    await commitIn(wt, 'b.txt', 'two\n', 'task: WIP');
    git(wt, 'push', '-q', '-u', 'origin', 'task/1');
    expect(originHas(root, 'task/1')).toBe(true);

    const res = await publishToBase(wt, { branch: 'task/1', base: 'init' });

    expect(res.ok).toBe(true);
    expect(originHas(root, 'task/1')).toBe(false);
  });

  describe('исход запуска', () => {
    const run = { code: 0, stdout: '', stderr: '', reason: null };
    const common = { res: run, data: { result: 'Готово: добавил b' }, question: '', cfg: { timeoutMin: 30 }, log: '', costUsd: 0.2 };

    it('результат в основной ветке: статус «На проверке», ветка — основная, diff по коммитам запуска', async () => {
      await commitIn(wt, 'b.txt', 'two\n', 'task: add b');
      const outcome = await resolveOutcome({ ...common, wt, startPoint: 'origin/init', branch: 'task/1', base: 'init' });

      expect(outcome.status).toBe('review');
      expect(outcome.summary).toMatch(/^Изменения отправлены в ветку init \(коммитов: 1\)\./);
      expect(outcome.summary).toContain('Готово: добавил b');
      expect(outcome.branch).toBe('init');
      expect(originLog(root)).toContain('task: add b');
      expect(originHas(root, 'task/1')).toBe(false);

      process.env.REPOS_DIR = root;
      const diff = await taskDiff({ project: 'shop', branch: outcome.branch, diffRange: outcome.diffRange });
      expect(diff).toContain('b.txt');
      expect(diff).toContain('+two');
      delete process.env.REPOS_DIR;
    });

    it('при конфликте с целевой веткой: «Ошибка», причина и ветка с сохранённой работой названы в итоге', async () => {
      await commitIn(wt, 'a.txt', 'mine\n', 'task: edit a');
      await commitIn(other, 'a.txt', 'theirs\n', 'owner: edit a');
      git(other, 'push', '-q', 'origin', 'HEAD:init');

      const outcome = await resolveOutcome({ ...common, wt, startPoint: 'origin/init', branch: 'task/1', base: 'init' });

      expect(outcome.status).toBe('failed');
      expect(outcome.summary).toMatch(/Не удалось влить изменения в ветку init \(конфликт с новыми коммитами\)/);
      expect(outcome.summary).toContain('Изменения сохранены в ветке task/1');
      expect(outcome.branch).toBeUndefined();
    });

    it('результат в UAT: ветка создаётся от основной, основная не меняется, хеши коммитов возвращаются', async () => {
      await prepareWorkdir(repo, 'task/2', 'uat', 'init');
      expect(originHas(root, 'uat')).toBe(true);
      await commitIn(wt, 'b.txt', 'two\n', 'task: add b');
      const outcome = await resolveOutcome({ ...common, wt, startPoint: 'origin/uat', branch: 'task/2', base: 'uat' });

      expect(outcome.status).toBe('review');
      expect(outcome.branch).toBe('uat');
      expect(outcome.commits).toHaveLength(1);
      expect(originLog(root, 'uat')).toContain('task: add b');
      expect(originLog(root)).not.toContain('task: add b');
      expect(originHas(root, 'task/2')).toBe(false);
    });

    it('без новых коммитов запуск — ошибка', async () => {
      const outcome = await resolveOutcome({ ...common, wt, startPoint: 'origin/init', branch: 'task/1', base: 'init' });
      expect(outcome).toMatchObject({ status: 'failed', summary: 'Claude не создал коммитов.' });
    });
  });

  describe('приёмка: перенос коммитов из UAT в основную ветку', () => {
    async function publishToUat(branch, file, message) {
      await prepareWorkdir(repo, branch, 'uat', 'init');
      await commitIn(wt, file, `${file}\n`, message);
      return (await publishToBase(wt, { branch, base: 'uat' })).shas;
    }

    it('в основную уходят только коммиты принятой задачи, другие задачи в UAT остаются', async () => {
      await publishToUat('task/2', 'b.txt', 'task: add b');
      const second = await publishToUat('task/3', 'c.txt', 'task: add c');

      const res = await promoteToBase(repo, { base: 'init', commits: second });

      expect(res).toEqual({ ok: true });
      expect(originLog(root)).toContain('task: add c');
      expect(originLog(root)).not.toContain('task: add b');
      expect(originLog(root, 'uat')).toContain('task: add b');
      expect(git(repo, 'worktree', 'list').trim().split('\n')).toHaveLength(1);
    });

    it('при конфликте основная ветка не меняется, временная копия убрана', async () => {
      await prepareWorkdir(repo, 'task/2', 'uat', 'init');
      await commitIn(wt, 'a.txt', 'uat version\n', 'task: edit a in uat');
      const { shas } = await publishToBase(wt, { branch: 'task/2', base: 'uat' });
      await commitIn(other, 'a.txt', 'theirs\n', 'owner: edit a');
      git(other, 'push', '-q', 'origin', 'HEAD:init');

      const res = await promoteToBase(repo, { base: 'init', commits: shas });

      expect(res).toMatchObject({ ok: false, reason: 'conflict' });
      expect(originLog(root)).not.toContain('task: edit a in uat');
      expect(git(repo, 'worktree', 'list').trim().split('\n')).toHaveLength(1);
    });
  });
});
