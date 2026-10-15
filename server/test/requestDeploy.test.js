import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Очередь сборок стендов: по одной, повторный запрос не теряется, итог пишется в проект и уходит владельцу.
process.env.UAT_DOMAIN = 'example.com';
const deployStand = jest.fn();
const saveStandState = jest.fn(async () => {});
const failInterruptedStands = jest.fn(async () => {});
const notify = jest.fn(async () => {});
jest.unstable_mockModule('../src/services/uat/deployStand.js', () => ({ deployStand }));
jest.unstable_mockModule('../src/services/store/projects.js', () => ({ saveStandState, failInterruptedStands }));
jest.unstable_mockModule('../src/services/notify/owner.js', () => ({ notify }));
jest.unstable_mockModule('../src/services/ops/platform.js', () => ({ opsAvailable: () => true }));

const { requestDeploy, failInterruptedDeploys } = await import('../src/services/uat/requestDeploy.js');

const idle = () => new Promise((resolve) => { setImmediate(resolve); });
const settle = async () => { for (let i = 0; i < 20; i += 1) await idle(); };

beforeEach(() => {
  deployStand.mockReset();
  saveStandState.mockClear();
  notify.mockClear();
  delete process.env.UAT_DOMAIN;
  process.env.UAT_DOMAIN = 'example.com';
});

describe('очередь сборок стендов', () => {
  it('успех: статус «ready» с коммитом, владельцу уходит сообщение со ссылкой', async () => {
    deployStand.mockResolvedValue({ host: 'shop.example.com', commit: 'abc1234' });

    expect(requestDeploy('shop')).toBe(true);
    await settle();

    expect(saveStandState).toHaveBeenNthCalledWith(1, 'shop', { uatStatus: 'building', uatError: '' });
    expect(saveStandState).toHaveBeenNthCalledWith(2, 'shop', expect.objectContaining({ uatStatus: 'ready', uatCommit: 'abc1234' }));
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('https://shop.example.com'));
  });

  it('ошибка: статус «failed» с причиной, владелец предупреждён', async () => {
    deployStand.mockRejectedValue(new Error('Приложение стенда не ответило'));

    requestDeploy('shop');
    await settle();

    expect(saveStandState).toHaveBeenLastCalledWith('shop', { uatStatus: 'failed', uatError: 'Приложение стенда не ответило' });
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('не собрался: Приложение стенда не ответило'));
  });

  it('сборки идут по одной, повторный запрос собирающегося проекта собирает его ещё раз', async () => {
    let release;
    let active = 0;
    let maxActive = 0;
    deployStand.mockImplementation(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => { release = resolve; });
      active -= 1;
      return { host: 'x', commit: 'c' };
    });

    requestDeploy('a');
    requestDeploy('b');
    requestDeploy('a');
    requestDeploy('a');
    await settle();
    expect(deployStand).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 3; i += 1) {
      release();
      await settle();
    }

    expect(deployStand.mock.calls.map((c) => c[0])).toEqual(['a', 'b', 'a']);
    expect(maxActive).toBe(1);
  });

  it('без UAT_DOMAIN стенды выключены: ничего не делает', async () => {
    delete process.env.UAT_DOMAIN;

    expect(requestDeploy('shop')).toBe(false);
    await settle();

    expect(deployStand).not.toHaveBeenCalled();
  });

  it('после перезапуска сервера зависшие сборки помечаются ошибкой', async () => {
    await failInterruptedDeploys();
    expect(failInterruptedStands).toHaveBeenCalledWith(expect.stringContaining('перезапуском'));
  });
});
