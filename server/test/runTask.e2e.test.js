import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Сквозной прогон запуска задачи: настоящие runTask, воркер, git и очередь, подставной `claude` (скрипт).
// Подменены только база (Task), версия токена, уведомление в Telegram и скриншоты.
process.env.JWT_SECRET = 'test-secret';

const tasks = new Map();
class FakeTask {
  constructor(data) {
    Object.assign(this, { comments: [], runs: [], ...data });
    tasks.set(String(this._id), this);
  }

  async save() { return this; }

  static findById(id) {
    const task = tasks.get(String(id)) ?? null;
    const query = {
      select: () => query,
      lean: async () => (task ? { ...task } : null),
      then: (resolve, reject) => Promise.resolve(task).then(resolve, reject),
    };
    return query;
  }

  static async updateOne(filter, update) {
    const task = tasks.get(String(filter._id));
    if (task) Object.assign(task, update);
    return {};
  }
}

const branching = { base: 'init', direct: false };
const notifyRunFinished = jest.fn(async () => {});
jest.unstable_mockModule('../src/models/Task.js', () => ({ default: FakeTask, onTaskStatusChange: () => {} }));
jest.unstable_mockModule('../src/services/auth/tokenVersion.js', () => ({ currentTokenVersion: async () => 1, revokeAllTokens: async () => 2 }));
jest.unstable_mockModule('../src/services/projects/baseBranch.js', () => ({ branchSettings: async () => ({ ...branching }), baseBranch: async () => branching.base }));
jest.unstable_mockModule('../src/worker/notifyRun.js', () => ({ notifyRunFinished }));
jest.unstable_mockModule('../src/worker/screenshots/materializeScreenshots.js', () => ({ materializeScreenshots: async () => [] }));

const { runTask } = await import('../src/worker/runTask.js');

const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });

// Подставной claude: как настоящий, печатает события stream-json, меняет файлы и делает коммит
const FAKE_CLAUDE = `#!/usr/bin/env node
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const out = (event) => console.log(JSON.stringify(event));
const mode = process.env.FAKE_CLAUDE_MODE || 'ok';
out({ type: 'system', subtype: 'init' });
if (mode === 'limit') {
  out({ type: 'result', subtype: 'success', is_error: true, result: 'Claude AI usage limit reached|1760000000' });
  process.exit(1);
}
if (process.env.FAKE_SEEN_FILE) fs.writeFileSync(process.env.FAKE_SEEN_FILE, String(fs.existsSync('.claude/skills/implement-task/SKILL.md')));
fs.writeFileSync('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>');
execFileSync('git', ['add', 'logo.svg']);
execFileSync('git', ['commit', '-q', '-m', 'task: add logo'], { stdio: 'inherit' });
// Всё, что Claude прочитал по ходу работы, попадает в вывод: в репозитории MyTracker это и limits.js, и rate-limit в app.js
out({ type: 'user', message: { content: [{ type: 'tool_result', content: "import rateLimit from 'express-rate-limit'; // Достигнут лимит Claude, rate limit, usage limit" }] } });
out({ type: 'result', subtype: 'success', is_error: false, result: 'Готово: логотип добавлен (лимит запросов не менялся)', total_cost_usd: 0.1, session_id: 's1' });
`;

describe('запуск задачи от кнопки до коммита на GitHub', () => {
  let root;
  let originDir;
  const saved = { ...process.env };

  async function setup({ identity = true } = {}) {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'mt-e2e-'));
    originDir = path.join(root, 'origin.git');
    execFileSync('git', ['init', '-q', '--bare', '-b', 'init', originDir]);
    const seed = path.join(root, 'seed');
    execFileSync('git', ['clone', '-q', originDir, seed]);
    git(seed, '-c', 'user.name=seed', '-c', 'user.email=s@e.st', 'commit', '-q', '--allow-empty', '-m', 'first');
    git(seed, 'push', '-q', 'origin', 'HEAD:init');

    const reposDir = path.join(root, 'repos');
    await fs.mkdir(reposDir);
    execFileSync('git', ['clone', '-q', originDir, path.join(reposDir, 'mytracker')]);
    if (identity) {
      git(path.join(reposDir, 'mytracker'), 'config', 'user.name', 'worker');
      git(path.join(reposDir, 'mytracker'), 'config', 'user.email', 'w@e.st');
    }
    const bin = path.join(root, 'claude');
    await fs.writeFile(bin, FAKE_CLAUDE, { mode: 0o755 });
    Object.assign(process.env, { REPOS_DIR: reposDir, WORKTREES_DIR: path.join(root, 'worktrees'), CLAUDE_BIN: bin });
    await fs.mkdir(process.env.WORKTREES_DIR);

    if (!identity) {
      // Как на свежем сервере: у пользователя нет ни глобального, ни системного git-имени, угадывать запрещено
      const home = path.join(root, 'home');
      await fs.mkdir(home);
      Object.assign(process.env, {
        HOME: home, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
        GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'user.useConfigOnly', GIT_CONFIG_VALUE_0: 'true',
      });
    }
    return new FakeTask({ _id: 'a'.repeat(24), project: 'mytracker', title: 'Добавить логотип приложения', status: 'in_progress', queued: true, queuedAnswer: '', pendingQuestion: '', sessionId: '' });
  }

  beforeEach(() => {
    branching.direct = false;
    notifyRunFinished.mockClear();
    delete process.env.FAKE_CLAUDE_MODE;
  });

  afterEach(async () => {
    process.env = { ...saved };
    tasks.clear();
    await fs.rm(root, { recursive: true, force: true });
  });

  const originHas = (branch) => git(originDir, 'branch', '--list', branch).trim() !== '';

  it('успешный запуск: коммит дошёл до ветки задачи на GitHub, статус «На проверке»', async () => {
    const task = await setup();
    await runTask(task._id);

    expect(task.runs.at(-1).summary).toBe('Готово: логотип добавлен (лимит запросов не менялся)');
    expect(task.status).toBe('review');
    expect(originHas(`task/${task._id}`)).toBe(true);
    expect(git(originDir, 'log', `task/${task._id}`, '--format=%s')).toContain('task: add logo');
  });

  it('слова про лимит в том, что Claude прочитал или написал, не считаются исчерпанным лимитом', async () => {
    const task = await setup();
    await runTask(task._id);

    expect(task.status).not.toBe('ready');
    expect(task.runs.at(-1).summary).not.toMatch(/Достигнут лимит Claude/);
  });

  it('инструкция /implement-task есть в рабочей копии проекта, но в коммит не попадает', async () => {
    const task = await setup();
    const seen = path.join(root, 'seen.txt');
    process.env.FAKE_SEEN_FILE = seen;
    await runTask(task._id);

    expect(await fs.readFile(seen, 'utf8')).toBe('true');
    expect(task.status).toBe('review');
    expect(git(originDir, 'ls-tree', '-r', '--name-only', `task/${task._id}`)).not.toContain('.claude');
  });

  it('своя инструкция проекта не заменяется', async () => {
    const task = await setup();
    const seed = path.join(root, 'seed');
    await fs.mkdir(path.join(seed, '.claude/skills/implement-task'), { recursive: true });
    await fs.writeFile(path.join(seed, '.claude/skills/implement-task/SKILL.md'), 'своя');
    git(seed, 'add', '.');
    git(seed, '-c', 'user.name=s', '-c', 'user.email=s@e.st', 'commit', '-q', '-m', 'skill');
    git(seed, 'push', '-q', 'origin', 'HEAD:init');
    await runTask(task._id);

    expect(git(originDir, 'show', `task/${task._id}:.claude/skills/implement-task/SKILL.md`)).toBe('своя');
  });

  it('режим «в основную ветку»: коммит дошёл до основной ветки', async () => {
    branching.direct = true;
    const task = await setup();
    await runTask(task._id);

    expect(task.status).toBe('review');
    expect(task.branch).toBe('init');
    expect(git(originDir, 'log', 'init', '--format=%s')).toContain('task: add logo');
    expect(originHas(`task/${task._id}`)).toBe(false);
  });

  it('настоящий лимит подписки по-прежнему возвращает задачу в «Готово к работе»', async () => {
    process.env.FAKE_CLAUDE_MODE = 'limit';
    const task = await setup();
    await runTask(task._id);

    expect(task.status).toBe('ready');
    expect(task.runs.at(-1).summary).toMatch(/Достигнут лимит Claude/);
  });

  it('на свежем сервере без git-имени коммит всё равно создаётся', async () => {
    const task = await setup({ identity: false });
    await runTask(task._id);

    expect(task.runs.at(-1).log).not.toMatch(/Committer identity unknown|unable to auto-detect|tell me who you are/i);
    expect(task.status).toBe('review');
    expect(git(originDir, 'log', `task/${task._id}`, '--format=%s')).toContain('task: add logo');
  });
});
