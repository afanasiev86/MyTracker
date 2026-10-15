import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Что у проекта на сервере: локальная копия и запущенный стенд. docker и du подменены.
const run = jest.fn();
jest.unstable_mockModule('../src/services/ops/exec.js', () => ({ run }));
jest.unstable_mockModule('../src/services/ops/platform.js', () => ({ opsAvailable: () => true }));

const { parseSize, standRuntime } = await import('../src/services/uat/standRuntime.js');
const { localCopy } = await import('../src/services/projects/localCopy.js');
const { projectServerInfo } = await import('../src/services/projects/serverInfo.js');

const out = (stdout) => ({ ok: true, stdout, stderr: '', error: '' });

describe('разбор размера docker', () => {
  it('понимает двоичные и десятичные единицы', () => {
    expect(parseSize('45.2MiB')).toBe(Math.round(45.2 * 1024 * 1024));
    expect(parseSize('1GiB')).toBe(1024 ** 3);
    expect(parseSize('512kB')).toBe(512000);
    expect(parseSize('0B')).toBe(0);
    expect(parseSize('--')).toBe(0);
  });
});

describe('что запущено у стенда', () => {
  beforeEach(() => run.mockReset());

  it('считает контейнеры и складывает память запущенных', async () => {
    run
      .mockResolvedValueOnce(out('aaa|running\nbbb|running\nccc|exited\n'))
      .mockResolvedValueOnce(out('100MiB / 9.6GiB\n50MiB / 9.6GiB\n'));

    const state = await standRuntime('shop');

    expect(state).toEqual({ containers: 3, running: 2, memoryBytes: 150 * 1024 * 1024 });
    expect(run.mock.calls[0][1]).toEqual(expect.arrayContaining(['label=com.docker.compose.project=uat-shop']));
    expect(run.mock.calls[1][1]).toEqual(expect.arrayContaining(['stats', '--no-stream', 'aaa', 'bbb']));
  });

  it('ничего не запущено: память не запрашивается', async () => {
    run.mockResolvedValueOnce(out(''));

    expect(await standRuntime('shop')).toEqual({ containers: 0, running: 0, memoryBytes: 0 });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('docker не ответил: причина в ответе', async () => {
    run.mockResolvedValueOnce({ ok: false, stdout: '', stderr: 'permission denied while trying to connect\nвторая строка', error: 'x' });

    expect(await standRuntime('shop')).toEqual({ error: 'permission denied while trying to connect' });
  });
});

describe('локальная копия', () => {
  let root;
  const saved = { ...process.env };

  beforeEach(async () => {
    run.mockReset();
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'mt-copy-'));
    process.env.REPOS_DIR = root;
  });

  afterEach(async () => {
    process.env = { ...saved };
    await fs.rm(root, { recursive: true, force: true });
  });

  it('папка есть: путь и размер из du', async () => {
    await fs.mkdir(path.join(root, 'shop'));
    run.mockResolvedValueOnce(out(`123456\t${path.join(root, 'shop')}\n`));

    expect(await localCopy('shop')).toEqual({ configured: true, path: path.join(root, 'shop'), exists: true, sizeBytes: 123456 });
  });

  it('папки нет: размер не считается', async () => {
    expect(await localCopy('shop')).toEqual({ configured: true, path: path.join(root, 'shop'), exists: false, sizeBytes: 0 });
    expect(run).not.toHaveBeenCalled();
  });

  it('du не сработал: размер неизвестен, а не ноль', async () => {
    await fs.mkdir(path.join(root, 'shop'));
    run.mockResolvedValueOnce({ ok: false, stdout: '', stderr: 'x', error: 'x' });

    expect((await localCopy('shop')).sizeBytes).toBeNull();
  });

  it('папка проектов не настроена', async () => {
    delete process.env.REPOS_DIR;
    expect(await localCopy('shop')).toEqual({ configured: false });
  });
});

describe('сводка по проекту', () => {
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; });

  it('UAT выключен: стенда нет, docker не опрашивается', async () => {
    delete process.env.UAT_DOMAIN;
    delete process.env.REPOS_DIR;
    run.mockReset();

    const info = await projectServerInfo({ slug: 'shop' });

    expect(info.stand).toMatchObject({ enabled: false, status: 'none', url: '', runtime: null });
    expect(run).not.toHaveBeenCalled();
  });

  it('проект пушит сразу в ПРОД: стенда нет даже при включённом UAT', async () => {
    process.env.UAT_DOMAIN = 'example.com';
    delete process.env.REPOS_DIR;

    expect((await projectServerInfo({ slug: 'shop', commitToBase: true })).stand.enabled).toBe(false);
  });

  it('стенд включён: адрес, итог сборки и то, что запущено', async () => {
    process.env.UAT_DOMAIN = 'example.com';
    delete process.env.REPOS_DIR;
    run.mockReset().mockResolvedValueOnce(out('aaa|running\n')).mockResolvedValueOnce(out('10MiB / 1GiB\n'));

    const info = await projectServerInfo({ slug: 'shop', uatStatus: 'ready', uatCommit: 'abc1234' });

    expect(info.stand).toMatchObject({ enabled: true, url: 'https://shop.example.com', status: 'ready', commit: 'abc1234', runtime: { running: 1, memoryBytes: 10 * 1024 * 1024 } });
  });
});
