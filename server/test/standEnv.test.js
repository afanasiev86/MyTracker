import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Просмотр .env стенда: разбор файла и доступ только владельцу. База подменена.
const findProject = jest.fn();
jest.unstable_mockModule('../src/services/store/index.js', () => ({ findProject }));

const { readStandEnv } = await import('../src/services/uat/readStandEnv.js');
const { standEnv } = await import('../src/routes/projects/standEnv.js');

describe('разбор .env стенда', () => {
  let root;
  const saved = { ...process.env };

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'mt-env-'));
    process.env.UAT_DIR = root;
    await fs.mkdir(path.join(root, 'shop'));
  });

  afterEach(async () => {
    process.env = { ...saved };
    await fs.rm(root, { recursive: true, force: true });
  });

  it('читает переменные и помечает пароли; знак «=» внутри значения сохраняется', async () => {
    await fs.writeFile(path.join(root, 'shop', '.env'), '# служебный файл\nUAT_PORT=4123\n\nSTAND_SECRET_A=abc=def\nSTAND_URL=https://shop.example.com\n');

    const env = await readStandEnv('shop');

    expect(env.exists).toBe(true);
    expect(env.entries).toEqual([
      { key: 'UAT_PORT', value: '4123', secret: false },
      { key: 'STAND_SECRET_A', value: 'abc=def', secret: true },
      { key: 'STAND_URL', value: 'https://shop.example.com', secret: false },
    ]);
  });

  it('файла нет: exists false и пустой список', async () => {
    expect(await readStandEnv('shop')).toMatchObject({ exists: false, entries: [] });
  });
});

describe('GET /api/projects/:id/uat/env', () => {
  const id = 'a'.repeat(24);
  const run = async (user) => {
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    const next = jest.fn();
    await standEnv({ user, params: { id } }, res, next);
    return { res, next };
  };

  beforeEach(() => findProject.mockReset());

  it('токен воркера (им работает Claude) не пускается и базу не читает', async () => {
    const { res } = await run({ sub: 'worker' });

    expect(res.statusCode).toBe(403);
    expect(findProject).not.toHaveBeenCalled();
  });

  it('неизвестный проект: not_found уходит в обработчик ошибок', async () => {
    findProject.mockResolvedValue(null);

    const { next } = await run({ sub: 'owner' });

    expect(next.mock.calls[0][0]).toMatchObject({ code: 'not_found' });
  });
});
