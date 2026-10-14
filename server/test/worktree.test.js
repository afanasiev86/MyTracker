import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { prepareWorktree } from '../src/worker/worktree.js';

const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });

describe('рабочая копия задачи начинается от основной ветки проекта', () => {
  let root;
  let repo;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'mt-wt-'));
    const origin = path.join(root, 'origin');
    await fs.mkdir(origin);
    git(origin, 'init', '-q', '-b', 'init');
    git(origin, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'first');
    repo = path.join(root, 'repo');
    execFileSync('git', ['clone', '-q', origin, repo]);
  });
  afterEach(() => fs.rm(root, { recursive: true, force: true }));

  it('берёт ветку проекта, даже если это не main', async () => {
    const startPoint = await prepareWorktree(repo, 'task/1', path.join(root, 'wt'), 'init');
    expect(startPoint).toBe('origin/init');
    expect(git(path.join(root, 'wt'), 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('task/1');
  });

  it('если основной ветки нет в origin, падает с понятной причиной git', async () => {
    await expect(prepareWorktree(repo, 'task/2', path.join(root, 'wt2'), 'main')).rejects.toThrow(/origin\/main/);
  });
});
