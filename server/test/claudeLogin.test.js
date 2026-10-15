import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, jest, beforeAll, beforeEach, afterEach } from '@jest/globals';

// Вход в подписку Claude через HTTP: настоящие маршруты, сервис и псевдотерминал (утилита script),
// вместо claude — скрипт, который печатает ссылку как настоящий `claude setup-token`, ждёт код и выдаёт токен.
process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_PASSWORD = 'test-password';

const settings = { findOne: jest.fn(), updateOne: jest.fn(async () => ({})) };
jest.unstable_mockModule('../src/models/Settings.js', () => ({ default: settings }));
jest.unstable_mockModule('../src/services/auth/tokenVersion.js', () => ({
  currentTokenVersion: async () => 1,
  revokeAllTokens: jest.fn(async () => 2),
}));

const request = (await import('supertest')).default;
const { createApp } = await import('../src/app.js');
const { issueToken } = await import('../src/services/auth/tokens.js');
const { clearClaudeSettings, getClaudeCredential } = await import('../src/services/claude/settings.js');
const { findLoginError, findLoginUrl, findToken, stripAnsi } = await import('../src/services/claude/login/terminal.js');
const { cancelLogin, loginOptions, hasLogin } = await import('../src/services/claude/login/session.js');

const URL_OUT = 'https://claude.com/cai/oauth/authorize?code=true&client_id=test&response_type=code&scope=user%3Ainference&state=abc';
const TOKEN = 'sk-ant-oat01-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-abcdefghijklmnop';

const FAKE_CLAUDE = `#!/usr/bin/env node
const fs = require('node:fs');
if (process.env.PID_FILE) fs.writeFileSync(process.env.PID_FILE, String(process.pid));
if (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_CODE_OAUTH_TOKEN) fs.writeFileSync(process.env.ENV_LEAK_FILE, 'leak');
if (process.env.CFG_FILE) fs.writeFileSync(process.env.CFG_FILE, process.env.CLAUDE_CONFIG_DIR || '');
if (process.argv[2] !== 'setup-token') process.exit(2);
process.stdout.write('\\x1b[1mBrowser didn\\'t open?\\x1b[22m\\n');
process.stdout.write('\\x1b]8;id=1;${URL_OUT}\\x07\\x1b[2m${URL_OUT}\\x1b[22m\\x1b]8;;\\x07\\n');
process.stdout.write('Paste code here if prompted > ');
process.stdin.setEncoding('utf8');
let buf = '';
process.stdin.on('data', (d) => {
  buf += d;
  if (!buf.includes('\\r') && !buf.includes('\\n')) return;
  if (buf.trim() === 'GOOD#state') {
    process.stdout.write('\\n\\x1b[32mYour OAuth token (valid for 1 year):\\x1b[39m\\n\\n\\x1b[1m${TOKEN}\\x1b[22m\\n\\nStore this token securely.\\n');
    process.exit(0);
  }
  process.stdout.write('\\nOAuth error: Invalid code. Press Enter to retry.\\n');
  buf = '';
});
setTimeout(() => process.exit(3), 60000);
`;

let owner;
let client;
let app;
let dir;
beforeAll(async () => {
  app = createApp();
  owner = await issueToken('owner');
  client = await issueToken('client:1', '1h', { role: 'client', clientId: '1' });
});

beforeEach(async () => {
  settings.updateOne.mockClear();
  await clearClaudeSettings();
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mt-login-test-'));
  const bin = path.join(dir, 'claude');
  await fs.writeFile(bin, FAKE_CLAUDE, { mode: 0o755 });
  loginOptions.bin = bin;
  loginOptions.urlWaitMs = 8000;
  loginOptions.tokenWaitMs = 8000;
  process.env.PID_FILE = path.join(dir, 'pid');
  process.env.ENV_LEAK_FILE = path.join(dir, 'leak');
  process.env.CFG_FILE = path.join(dir, 'cfg');
});

afterEach(async () => {
  await cancelLogin();
  loginOptions.bin = null;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
  await fs.rm(dir, { recursive: true, force: true });
});

const auth = (r, token = owner) => r.set('Authorization', `Bearer ${token}`);
const start = () => auth(request(app).post('/api/claude/login'));
const finish = (body) => auth(request(app).post('/api/claude/login/code')).send(body);
// Завершённый процесс без родителя может остаться «зомби» до очистки системой: он уже не работает
const alive = async (pid) => {
  const status = await fs.readFile(`/proc/${pid}/status`, 'utf8').catch(() => '');
  return status !== '' && !/State:\s+Z/.test(status);
};
const exists = (file) => fs.access(file).then(() => true, () => false);

describe('вход в подписку Claude из настроек', () => {
  it('отдаёт ссылку для входа без управляющих символов', async () => {
    const res = await start();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ url: URL_OUT });
  });

  it('верный код: токен подписки сохраняется как oauth_token и наружу не отдаётся', async () => {
    await start();
    const res = await finish({ code: ' GOOD#state \n', label: 'Моя подписка Pro' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ connected: true, label: 'Моя подписка Pro', type: 'oauth_token' });
    expect(JSON.stringify(res.body)).not.toContain('sk-ant');
    expect(getClaudeCredential()).toEqual({ token: TOKEN, type: 'oauth_token' });
    expect(hasLogin()).toBe(false);
  });

  it('неверный код: 400 с причиной, аккаунт не меняется, вход закрыт', async () => {
    await start();
    const res = await finish({ code: 'WRONG#code', label: 'Моя' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Вход не удался: OAuth error: Invalid code/);
    expect(getClaudeCredential()).toBeNull();
    expect(hasLogin()).toBe(false);

    const again = await finish({ code: 'GOOD#state', label: 'Моя' });
    expect(again.status).toBe(400);
    expect(again.body.error).toMatch(/Вход не начат или истёк/);
  });

  it('код без начатого входа: 400', async () => {
    const res = await finish({ code: 'GOOD#state', label: 'Моя' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Вход не начат/);
  });

  it('пустой код или метка отклоняются', async () => {
    await start();
    expect((await finish({ code: '  ', label: 'Моя' })).status).toBe(400);
    expect((await finish({ code: 'GOOD#state', label: '' })).status).toBe(400);
    expect(hasLogin()).toBe(true);
  });

  it('claude запускается без ключей из окружения сервера и без прежнего входа', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-api03-old';
    process.env.CLAUDE_CODE_OAUTH_TOKEN = 'sk-ant-oat01-old';
    await start();
    expect(await exists(process.env.ENV_LEAK_FILE)).toBe(false);
  });

  it('вход идёт в отдельной временной папке настроек claude, которая удаляется после отмены', async () => {
    await start();
    const cfg = await fs.readFile(process.env.CFG_FILE, 'utf8');
    expect(path.basename(cfg)).toMatch(/^mt-claude-login-/);
    expect(await exists(cfg)).toBe(true);

    await cancelLogin();
    expect(await exists(cfg)).toBe(false);
  });

  it('отмена и новый вход закрывают предыдущий процесс claude', async () => {
    await start();
    const pid = Number(await fs.readFile(process.env.PID_FILE, 'utf8'));
    expect(await alive(pid)).toBe(true);

    const res = await auth(request(app).delete('/api/claude/login'));
    expect(res.status).toBe(204);
    await new Promise((r) => setTimeout(r, 500));
    expect(await alive(pid)).toBe(false);
    expect(hasLogin()).toBe(false);
  });

  it('claude не запустился: 503 с понятным текстом, вход не остаётся открытым', async () => {
    loginOptions.bin = path.join(dir, 'нет-такого');
    loginOptions.urlWaitMs = 3000;
    const res = await start();
    expect(res.status).toBe(503);
    expect(res.body.error).toBeTruthy();
    expect(hasLogin()).toBe(false);
  });

  it('только владелец: без токена 401, заказчику 403', async () => {
    expect((await request(app).post('/api/claude/login')).status).toBe(401);
    expect((await auth(request(app).post('/api/claude/login'), client)).status).toBe(403);
    expect((await auth(request(app).post('/api/claude/login/code'), client).send({ code: 'x', label: 'y' })).status).toBe(403);
  });
});

describe('разбор вывода claude setup-token', () => {
  const ESC = String.fromCharCode(27);

  it('убирает цвета и перемещение курсора', () => {
    expect(stripAnsi(`${ESC}[1mHello${ESC}[22m${ESC}[2G world${ESC}]8;;${ESC}\\\r`)).toBe('Hello world');
  });

  it('ссылку находит и без гиперссылки OSC 8, в обычном тексте', () => {
    expect(findLoginUrl(`text\n${URL_OUT}\nPaste code`)).toBe(URL_OUT);
    expect(findLoginUrl('ничего похожего')).toBeNull();
  });

  it('токен находит среди цветного текста, чужие строки токеном не считает', () => {
    expect(findToken(`token:\n${ESC}[1m${TOKEN}${ESC}[22m\n`)).toBe(TOKEN);
    expect(findToken('sk-ant-api03-notoauthtoken0123456789abcdef')).toBeNull();
  });

  it('текст ошибки берёт одной короткой строкой', () => {
    expect(findLoginError(`${ESC}[31mOAuth error: Invalid code${ESC}[39m\nPress Enter`)).toBe('OAuth error: Invalid code');
    expect(findLoginError('всё хорошо')).toBeNull();
  });
});
