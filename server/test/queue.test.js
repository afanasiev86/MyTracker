import { jest } from '@jest/globals';
import { enqueue } from '../src/worker/queue/enqueue.js';
import { queueSizes } from '../src/worker/queue/queueSizes.js';

// Задание, которое завершаем вручную: так видно, в каком порядке очередь их запускает
function manualJob(log, name) {
  let finish;
  const done = new Promise((resolve) => { finish = resolve; });
  const job = () => {
    log.push(name);
    return done;
  };
  return { job, finish };
}

const tick = () => new Promise((resolve) => setImmediate(resolve));

describe('очередь с приоритетом', () => {
  it('срочная задача запускается раньше обычных, которые стояли раньше', async () => {
    const log = [];
    const key = 'prio-a';
    const blocker = manualJob(log, 'blocker');
    const normal = manualJob(log, 'normal');
    const high = manualJob(log, 'high');

    const first = enqueue(key, blocker.job);
    const second = enqueue(key, normal.job, { priority: 'normal' });
    const third = enqueue(key, high.job, { priority: 'high' });
    await tick();
    expect(log).toEqual(['blocker']);

    blocker.finish();
    await tick();
    expect(log).toEqual(['blocker', 'high']);

    high.finish();
    await tick();
    normal.finish();
    await Promise.all([first, second, third]);
    expect(log).toEqual(['blocker', 'high', 'normal']);
  });

  it('внутри одного приоритета сохраняется порядок поступления', async () => {
    const log = [];
    const key = 'prio-b';
    const blocker = manualJob(log, 'blocker');
    const a = manualJob(log, 'a');
    const b = manualJob(log, 'b');

    enqueue(key, blocker.job, { priority: 'low' });
    enqueue(key, a.job, { priority: 'high' });
    enqueue(key, b.job, { priority: 'high' });
    blocker.finish();
    await tick();
    expect(log).toEqual(['blocker', 'a']);
    a.finish();
    await tick();
    b.finish();
    await tick();
    expect(log).toEqual(['blocker', 'a', 'b']);
  });

  it('ошибка в задании не останавливает очередь', async () => {
    const log = [];
    const key = 'prio-c';
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await enqueue(key, async () => { throw new Error('сбой'); });
    await enqueue(key, async () => { log.push('после ошибки'); });
    errSpy.mockRestore();
    expect(log).toEqual(['после ошибки']);
  });

  it('пустая очередь не остаётся в памяти', async () => {
    await enqueue('prio-d', async () => {});
    await tick();
    expect(queueSizes()['prio-d']).toBeUndefined();
  });
});
