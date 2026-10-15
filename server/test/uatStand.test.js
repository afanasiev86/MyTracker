import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Выдача порта и открытие стенда. База и sudo подменены: проверяется логика решения.
process.env.UAT_DOMAIN = 'example.com';
const listStandPorts = jest.fn();
const saveStandPort = jest.fn(async () => {});
const run = jest.fn();
jest.unstable_mockModule('../src/services/store/projects.js', () => ({ listStandPorts, saveStandPort }));
jest.unstable_mockModule('../src/services/ops/exec.js', () => ({ run }));
jest.unstable_mockModule('../src/services/ops/platform.js', () => ({ assertOpsAvailable: () => {} }));

const { standHost } = await import('../src/services/uat/standHost.js');
const { pickPort, PORT_MIN, PORT_MAX } = await import('../src/services/uat/ports.js');
const { ensureStand } = await import('../src/services/uat/ensureStand.js');

beforeEach(() => {
  listStandPorts.mockReset();
  saveStandPort.mockReset();
  saveStandPort.mockResolvedValue();
  run.mockReset();
  run.mockResolvedValue({ ok: true, stdout: '', stderr: '', error: '' });
});

describe('адрес стенда', () => {
  it('строится из кода проекта и домена', () => {
    expect(standHost('shop-api', 'example.com')).toBe('shop-api.example.com');
  });

  it('зарезервированные и недопустимые имена отклоняются', () => {
    for (const slug of ['www', 'tracker', 'uat', '-shop', 'shop-', 'Shop', 'a'.repeat(64)]) {
      expect(() => standHost(slug, 'example.com')).toThrow(/не подходит/);
    }
  });

  it('без домена стенды выключены', () => {
    expect(() => standHost('shop', '')).toThrow(/UAT_DOMAIN/);
  });
});

describe('выбор порта', () => {
  it('берёт наименьший свободный', () => {
    expect(pickPort([])).toBe(PORT_MIN);
    expect(pickPort([PORT_MIN, PORT_MIN + 2])).toBe(PORT_MIN + 1);
  });

  it('когда порты кончились, сообщает об этом', () => {
    const all = Array.from({ length: PORT_MAX - PORT_MIN + 1 }, (_, i) => PORT_MIN + i);
    expect(() => pickPort(all)).toThrow(/свободные порты/);
  });
});

describe('ensureStand', () => {
  it('новому проекту выдаёт свободный порт, сохраняет его и открывает стенд', async () => {
    listStandPorts.mockResolvedValue([{ slug: 'a', uatPort: PORT_MIN }, { slug: 'shop' }]);

    const stand = await ensureStand('shop');

    expect(stand).toEqual({ host: 'shop.example.com', port: PORT_MIN + 1, url: 'https://shop.example.com' });
    expect(saveStandPort).toHaveBeenCalledWith('shop', PORT_MIN + 1);
    expect(run).toHaveBeenCalledWith('sudo', ['-n', '/usr/local/sbin/uat-expose', 'shop', String(PORT_MIN + 1)], expect.any(Object));
  });

  it('у проекта с портом он не меняется и повторно не сохраняется', async () => {
    listStandPorts.mockResolvedValue([{ slug: 'shop', uatPort: 4150 }]);

    const stand = await ensureStand('shop');

    expect(stand.port).toBe(4150);
    expect(saveStandPort).not.toHaveBeenCalled();
  });

  it('два проекта подряд получают разные порты', async () => {
    const saved = [];
    saveStandPort.mockImplementation(async (slug, port) => { saved.push({ slug, uatPort: port }); });
    listStandPorts.mockImplementation(async () => [{ slug: 'a' }, { slug: 'b' }, ...saved]);

    const [a, b] = await Promise.all([ensureStand('a'), ensureStand('b')]);

    expect(a.port).not.toBe(b.port);
  });

  it('неизвестный проект: not_found', async () => {
    listStandPorts.mockResolvedValue([]);
    await expect(ensureStand('ghost')).rejects.toMatchObject({ code: 'not_found' });
  });

  it('нет прав на sudo: подсказка выполнить deploy/uat-setup.sh', async () => {
    listStandPorts.mockResolvedValue([{ slug: 'shop' }]);
    run.mockResolvedValue({ ok: false, stdout: '', stderr: 'sudo: a password is required', error: 'x' });

    await expect(ensureStand('shop')).rejects.toThrow(/deploy\/uat-setup\.sh/);
  });

  it('скрипт упал: причина из его вывода попадает в ошибку', async () => {
    listStandPorts.mockResolvedValue([{ slug: 'shop' }]);
    run.mockResolvedValue({ ok: false, stdout: '', stderr: 'Не удалось получить сертификат для shop.example.com', error: 'x' });

    await expect(ensureStand('shop')).rejects.toThrow(/Не удалось получить сертификат/);
  });
});
