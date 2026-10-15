import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { prepareWorkdir } from '../src/worker/worktree.js';

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
    const startPoint = await prepareWorkdir(repo, 'task/1', 'init', 'init');
    expect(startPoint).toBe('origin/init');
    expect(git(repo, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('task/1');
  });

  it('если основной ветки нет в origin, падает с понятной причиной git', async () => {
    await expect(prepareWorkdir(repo, 'task/2', 'main', 'main')).rejects.toThrow(/origin\/main/);
  });

  it('стирает остатки прошлого запуска, но оставляет игнорируемые файлы (node_modules)', async () => {
    const origin = path.join(root, 'origin');
    await fs.writeFile(path.join(origin, '.gitignore'), 'node_modules/\n');
    git(origin, 'add', '.gitignore');
    git(origin, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'ignore');
    await prepareWorkdir(repo, 'task/3', 'init', 'init');
    await fs.mkdir(path.join(repo, 'node_modules'));
    await fs.writeFile(path.join(repo, 'node_modules', 'dep.js'), 'x');
    await fs.writeFile(path.join(repo, 'leftover.txt'), 'x');
    await fs.writeFile(path.join(repo, '.gitignore'), 'испорчено');

    await prepareWorkdir(repo, 'task/4', 'init', 'init');

    expect(git(repo, 'status', '--porcelain').trim()).toBe('');
    await expect(fs.access(path.join(repo, 'leftover.txt'))).rejects.toThrow();
    await expect(fs.access(path.join(repo, 'node_modules', 'dep.js'))).resolves.toBeUndefined();
  });

  it('если ветки UAT нет в origin, создаёт её от основной и начинает с неё', async () => {
    const startPoint = await prepareWorkdir(repo, 'task/7', 'uat', 'init');

    expect(startPoint).toBe('origin/uat');
    expect(git(path.join(root, 'origin'), 'rev-parse', 'uat').trim()).toBe(git(path.join(root, 'origin'), 'rev-parse', 'init').trim());
  });

  it('локальные ветки прошлых задач удаляются', async () => {
    await prepareWorkdir(repo, 'task/8', 'init', 'init');
    await prepareWorkdir(repo, 'task/9', 'init', 'init');

    expect(git(repo, 'branch', '--list', 'task/*').replace(/[* ]/g, '').trim()).toBe('task/9');
  });

  it('удаляет скриншоты и копию инструкции трекера, оставшиеся от прошлой задачи', async () => {
    await prepareWorkdir(repo, 'task/5', 'init', 'init');
    await fs.mkdir(path.join(repo, '.tracker-attachments'));
    await fs.writeFile(path.join(repo, '.tracker-attachments', '1.png'), 'x');
    await fs.mkdir(path.join(repo, '.claude/skills/implement-task'), { recursive: true });
    await fs.writeFile(path.join(repo, '.claude/skills/implement-task/SKILL.md'), 'старая');
    await fs.appendFile(path.join(repo, '.git/info/exclude'), '\n.tracker-attachments/\n.claude/skills/implement-task/\n');

    await prepareWorkdir(repo, 'task/6', 'init', 'init');

    await expect(fs.access(path.join(repo, '.tracker-attachments'))).rejects.toThrow();
    await expect(fs.access(path.join(repo, '.claude/skills/implement-task/SKILL.md'))).rejects.toThrow();
  });
});
