import { describe, it, expect, jest } from '@jest/globals';
import { recoverRuns } from '../src/services/runs/recoverRuns.js';

// Восстановление после перезапуска проверяем на подменённых зависимостях: база здесь не нужна
describe('восстановление запусков после перезапуска', () => {
  it('ставит обратно в очередь запуски, которые ждали, вместе с ответом владельца', async () => {
    const waiting = { _id: 'a', project: 'shop', queued: true, queuedAnswer: 'да' };
    const deps = {
      listInProgressTasks: jest.fn(async () => [waiting]),
      failInterruptedRun: jest.fn(),
      enqueueRun: jest.fn(),
    };
    const result = await recoverRuns(deps);
    expect(deps.enqueueRun).toHaveBeenCalledWith(waiting, 'да');
    expect(deps.failInterruptedRun).not.toHaveBeenCalled();
    expect(result).toEqual({ resumed: 1, failed: 0 });
  });

  it('ставит ошибку запускам, которые выполнялись, и не ставит их в очередь', async () => {
    const running = { _id: 'b', project: 'shop', queued: false, queuedAnswer: '' };
    const deps = {
      listInProgressTasks: jest.fn(async () => [running]),
      failInterruptedRun: jest.fn(),
      enqueueRun: jest.fn(),
    };
    const result = await recoverRuns(deps);
    expect(deps.enqueueRun).not.toHaveBeenCalled();
    expect(deps.failInterruptedRun).toHaveBeenCalledWith('b', expect.objectContaining({ author: 'system' }));
    expect(result).toEqual({ resumed: 0, failed: 1 });
  });

  it('без задач ничего не делает', async () => {
    const deps = { listInProgressTasks: async () => [], failInterruptedRun: jest.fn(), enqueueRun: jest.fn() };
    expect(await recoverRuns(deps)).toEqual({ resumed: 0, failed: 0 });
  });
});
