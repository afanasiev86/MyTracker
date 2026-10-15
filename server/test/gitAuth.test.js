import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { gitEnv, childEnv, gitAccessHint, GIT_ASKPASS_SCRIPT } from '../src/worker/env.js';
import { git } from '../src/worker/git.js';
import { CONFIG_ENV_KEYS, SECRET_ENV_KEYS } from '../src/config.js';

const run = promisify(execFile);
const TOKEN = 'github_pat_TEST_token_0123456789';
const basic = (user, pass) => `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
const pkt = (text) => `${(text.length + 4).toString(16).padStart(4, '0')}${text}`;

describe('токен GitHub для git по https', () => {
  let root;
  let server;
  let port;
  const seen = [];

  // Локальный «GitHub»: без верного пароля отвечает 401 (как GitHub для приватных репозиториев), с верным отдаёт список веток
  beforeAll(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'mt-auth-'));
    const bare = path.join(root, 'repo.git');
    execFileSync('git', ['init', '-q', '--bare', '-b', 'init', bare]);
    const seed = path.join(root, 'seed');
    execFileSync('git', ['clone', '-q', bare, seed]);
    execFileSync('git', ['-C', seed, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'first']);
    execFileSync('git', ['-C', seed, 'push', '-q', 'origin', 'HEAD:init']);

    server = http.createServer(async (req, res) => {
      seen.push(req.headers.authorization || '');
      if (req.headers.authorization !== basic('x-access-token', TOKEN)) {
        res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="github"' }).end();
        return;
      }
      const { stdout } = await run('git', ['upload-pack', '--stateless-rpc', '--advertise-refs', bare], { encoding: 'buffer' });
      res.writeHead(200, { 'Content-Type': 'application/x-git-upload-pack-advertisement' });
      res.end(Buffer.concat([Buffer.from(`${pkt('# service=git-upload-pack\n')}0000`), stdout]));
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = server.address().port;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  });

  const url = () => `http://127.0.0.1:${port}/repo.git`;
  const host = () => `127.0.0.1:${port}`;
  const noHelpers = ['-c', 'credential.helper='];

  it('без токена git не может войти и падает с понятным сообщением, а не зависает', async () => {
    const env = gitEnv({ token: '', host: host() });
    await expect(git(root, [...noHelpers, 'ls-remote', url()], { env })).rejects.toThrow(/terminal prompts disabled|could not read Username|Authentication failed/);
  });

  it('с токеном git получает его через GIT_ASKPASS и видит ветки приватного репозитория', async () => {
    const env = gitEnv({ token: TOKEN, host: host() });
    const out = await git(root, [...noHelpers, 'ls-remote', '--heads', url()], { env });
    expect(out).toMatch(/refs\/heads\/init/);
  });

  it('неверный токен отклоняется', async () => {
    const env = gitEnv({ token: 'wrong', host: host() });
    await expect(git(root, [...noHelpers, 'ls-remote', url()], { env })).rejects.toThrow(/Authentication failed|could not read|403|401/);
  });

  it('токен не уходит на другой хост: для чужого адреса скрипт ничего не отдаёт', async () => {
    seen.length = 0;
    const env = gitEnv({ token: TOKEN, host: 'github.com' });
    await expect(git(root, [...noHelpers, 'ls-remote', url()], { env })).rejects.toThrow();
    expect(seen.every((h) => h === '')).toBe(true);
  });

  it('токена нет ни в аргументах команды, ни в адресе', () => {
    const env = gitEnv({ token: TOKEN, host: 'github.com' });
    expect(env.GIT_ASKPASS).toBe(GIT_ASKPASS_SCRIPT);
    expect(env.GIT_TERMINAL_PROMPT).toBe('0');
    expect(env.MT_GIT_TOKEN).toBe(TOKEN);
  });

  it('скрипт отдаёт логин и токен только для своего хоста', async () => {
    const ask = (prompt, host) => run(GIT_ASKPASS_SCRIPT, [prompt], { env: { ...process.env, MT_GIT_TOKEN: TOKEN, MT_GIT_HOST: host } }).then((r) => r.stdout);
    expect(await ask("Username for 'https://github.com': ", 'github.com')).toBe('x-access-token\n');
    expect(await ask("Password for 'https://x-access-token@github.com': ", 'github.com')).toBe(`${TOKEN}\n`);
    expect(await ask("Password for 'https://evil.example.com': ", 'github.com')).toBe('');
  });
});

describe('окружение процессов', () => {
  it('без токена GIT_ASKPASS не задаётся, запросы пароля отключены', () => {
    const env = gitEnv({ base: { PATH: '/bin' }, token: '' });
    expect(env).toEqual({ PATH: '/bin', GIT_TERMINAL_PROMPT: '0' });
  });

  it('Claude и проверки проекта не получают ни токен GitHub, ни секреты сервера', () => {
    const base = { PATH: '/bin', HOME: '/h', MT_GIT_TOKEN: 'b', MT_GIT_HOST: 'c', GIT_ASKPASS: 'd' };
    for (const key of SECRET_ENV_KEYS) base[key] = 'секрет';
    expect(childEnv(base)).toEqual({ PATH: '/bin', HOME: '/h' });
  });

  it('несекретные настройки и вход Claude (HOME, PATH, ключ API) остаются', () => {
    const base = { PATH: '/bin', HOME: '/h', ANTHROPIC_API_KEY: 'k', TRACKER_API_URL: 'http://x', ATTACHMENTS_DIR: '/u' };
    expect(childEnv(base)).toEqual(base);
  });

  it('git тоже не получает секреты сервера, кроме токена GitHub для своих запросов', () => {
    const saved = { ...process.env };
    process.env.JWT_SECRET = 'jwt';
    process.env.MONGO_URL = 'mongodb://u:p@h/db';
    try {
      const env = gitEnv({ token: TOKEN, host: 'github.com' });
      expect(env.JWT_SECRET).toBeUndefined();
      expect(env.MONGO_URL).toBeUndefined();
      expect(env.MT_GIT_TOKEN).toBe(TOKEN);
    } finally {
      process.env = saved;
    }
  });

  it('любая новая переменная конфигурации с токеном, секретом или паролем внесена в SECRET_ENV_KEYS', () => {
    const risky = CONFIG_ENV_KEYS.filter((key) => /TOKEN|SECRET|PASSWORD|^MONGO/.test(key));
    expect(risky.length).toBeGreaterThan(0);
    expect(risky.filter((key) => !SECRET_ENV_KEYS.includes(key))).toEqual([]);
    expect(SECRET_ENV_KEYS.filter((key) => !CONFIG_ENV_KEYS.includes(key))).toEqual([]);
  });
});

describe('подсказка при отказе в доступе', () => {
  it.each([
    "fatal: could not read Username for 'https://github.com': No such device or address",
    "fatal: could not read Username for 'https://github.com': terminal prompts disabled",
    "remote: Invalid username or password.\nfatal: Authentication failed for 'https://github.com/o/r.git/'",
    'git@github.com: Permission denied (publickey).',
  ])('подсказывает про токен: %s', (text) => {
    expect(gitAccessHint(text)).toMatch(/токен в «Настройках» → «GitHub»/);
  });

  it('для других ошибок git подсказки нет', () => {
    expect(gitAccessHint('fatal: not a git repository')).toBe('');
    expect(gitAccessHint('CONFLICT (content): Merge conflict in a.txt')).toBe('');
  });
});
